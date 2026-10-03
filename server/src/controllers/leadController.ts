import { Response } from 'express';
import mongoose from 'mongoose';
import { Lead } from '../models/Lead';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { Activity } from '../models/Activity';
import { User } from '../models/User';
import { AuthenticatedRequest } from '../types';
import { buildRecordScopeFilter, canAccessRecord } from '../middlewares/rbac';
import { recordAuditLog } from '../utils/audit';

export const listLeads = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    page = '1',
    limit = '15',
    search,
    status,
    priority,
    source,
    assignedTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    includeArchived = 'false',
  } = req.query;

  const scopeFilter = buildRecordScopeFilter(user);
  const filter: any = { ...scopeFilter };

  if (includeArchived !== 'true') {
    filter.isArchived = false;
  }

  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (source) filter.source = source;
  if (assignedTo && (user.role === 'admin' || user.role === 'manager')) {
    filter.assignedTo = assignedTo;
  }

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { fullName: { $regex: s, $options: 'i' } },
      { company: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const sortDirection = sortOrder === 'asc' ? 1 : -1;
  const sortObj: any = { [sortBy as string]: sortDirection };

  const [leads, total] = await Promise.all([
    Lead.find(filter)
      .populate('assignedTo', 'name email role')
      .populate('teamId', 'name')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum),
    Lead.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: leads,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const checkDuplicates = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { email, phone, excludeLeadId } = req.query;

  const conditions: any[] = [];
  if (email) {
    const normEmail = String(email).trim().toLowerCase();
    conditions.push({ normalizedEmail: normEmail });
  }
  if (phone) {
    const normPhone = String(phone).replace(/[^0-9+]/g, '');
    if (normPhone) {
      conditions.push({ normalizedPhone: normPhone });
    }
  }

  if (conditions.length === 0) {
    res.json({ success: true, duplicates: [] });
    return;
  }

  const query: any = { $or: conditions, isArchived: false };
  if (excludeLeadId) {
    query._id = { $ne: excludeLeadId };
  }

  const duplicates = await Lead.find(query)
    .select('fullName company email phone status assignedTo')
    .populate('assignedTo', 'name')
    .limit(5);

  res.json({
    success: true,
    hasDuplicates: duplicates.length > 0,
    duplicates,
  });
};

export const getLeadById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const lead = await Lead.findById(id)
    .populate('assignedTo', 'name email role phone jobTitle')
    .populate('teamId', 'name')
    .populate('convertedContactId', 'name email phone jobTitle')
    .populate('convertedDealId', 'title value stage');

  if (!lead) {
    res.status(404).json({ success: false, message: 'Lead not found.' });
    return;
  }

  if (!canAccessRecord(user, lead)) {
    res.status(403).json({ success: false, message: 'Access denied to this lead.' });
    return;
  }

  const activities = await Activity.find({
    relatedType: 'lead',
    relatedId: lead._id,
  })
    .populate('authorId', 'name email role')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: lead,
    activities,
  });
};

export const createLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const {
    fullName,
    company,
    email,
    phone,
    source,
    priority,
    assignedTo,
    tags,
    notes,
    nextFollowUpDate,
  } = req.body;

  let finalAssignedTo: any = user._id;
  let finalTeamId: any = user.teamId || null;

  if (user.role === 'admin') {
    if (assignedTo) {
      const targetUser = await User.findById(assignedTo);
      if (targetUser) {
        finalAssignedTo = targetUser._id;
        finalTeamId = targetUser.teamId || null;
      }
    }
  } else if (user.role === 'manager') {
    if (assignedTo) {
      const targetUser = await User.findById(assignedTo);
      if (
        targetUser &&
        targetUser.teamId &&
        user.teamId &&
        targetUser.teamId.toString() === user.teamId.toString()
      ) {
        finalAssignedTo = targetUser._id;
        finalTeamId = user.teamId;
      } else {
        res.status(403).json({
          success: false,
          message: 'Managers can only assign leads to active members of their own team.',
        });
        return;
      }
    }
  } else {
    // Employee: must be assigned to self
    finalAssignedTo = user._id;
    finalTeamId = user.teamId || null;
  }

  const lead = await Lead.create({
    fullName: fullName.trim(),
    company: company?.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim(),
    source: source || 'Website',
    priority: priority || 'Medium',
    assignedTo: finalAssignedTo,
    teamId: finalTeamId,
    tags: Array.isArray(tags) ? tags : [],
    notes: notes?.trim(),
    nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
  });

  // Create initial activity note
  await Activity.create({
    type: 'Note',
    authorId: user._id,
    relatedType: 'lead',
    relatedId: lead._id,
    title: 'Lead Created',
    notes: notes ? `Initial Lead Created. Notes: ${notes}` : 'Initial Lead Created.',
  });

  await recordAuditLog({
    action: 'LEAD_CREATED',
    entityType: 'Lead',
    entityId: (lead._id as any).toString(),
    details: { fullName: lead.fullName, email: lead.email, assignedTo: finalAssignedTo },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Lead created successfully.',
    data: lead,
  });
};

export const updateLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const {
    fullName,
    company,
    email,
    phone,
    source,
    status,
    priority,
    assignedTo,
    tags,
    notes,
    nextFollowUpDate,
  } = req.body;

  const lead = await Lead.findById(id);
  if (!lead) {
    res.status(404).json({ success: false, message: 'Lead not found.' });
    return;
  }

  if (!canAccessRecord(user, lead)) {
    res.status(403).json({ success: false, message: 'Access denied to update this lead.' });
    return;
  }

  // Handle assignment permissions
  if (assignedTo && assignedTo.toString() !== lead.assignedTo?.toString()) {
    if (user.role === 'employee') {
      res.status(403).json({ success: false, message: 'Employees cannot reassign leads.' });
      return;
    }
    if (user.role === 'manager') {
      const targetUser = await User.findById(assignedTo);
      if (
        !targetUser ||
        !targetUser.teamId ||
        !user.teamId ||
        targetUser.teamId.toString() !== user.teamId.toString()
      ) {
        res.status(403).json({
          success: false,
          message: 'Managers can only assign leads within their own team.',
        });
        return;
      }
      lead.assignedTo = targetUser._id;
      lead.teamId = targetUser.teamId;
    } else if (user.role === 'admin') {
      const targetUser = await User.findById(assignedTo);
      if (targetUser) {
        lead.assignedTo = targetUser._id;
        lead.teamId = targetUser.teamId || null;
      }
    }
  }

  if (fullName !== undefined) lead.fullName = fullName.trim();
  if (company !== undefined) lead.company = company.trim();
  if (email !== undefined) lead.email = email.trim().toLowerCase();
  if (phone !== undefined) lead.phone = phone.trim();
  if (source !== undefined) lead.source = source;
  if (status !== undefined) lead.status = status;
  if (priority !== undefined) lead.priority = priority;
  if (tags !== undefined) lead.tags = Array.isArray(tags) ? tags : [];
  if (notes !== undefined) lead.notes = notes.trim();
  if (nextFollowUpDate !== undefined) {
    lead.nextFollowUpDate = nextFollowUpDate ? new Date(nextFollowUpDate) : null;
  }

  await lead.save();

  await recordAuditLog({
    action: 'LEAD_UPDATED',
    entityType: 'Lead',
    entityId: id,
    details: { fullName, status, priority, assignedTo },
    req,
  });

  res.json({
    success: true,
    message: 'Lead updated successfully.',
    data: lead,
  });
};

export const archiveLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const lead = await Lead.findById(id);
  if (!lead) {
    res.status(404).json({ success: false, message: 'Lead not found.' });
    return;
  }

  if (!canAccessRecord(user, lead)) {
    res.status(403).json({ success: false, message: 'Access denied to archive this lead.' });
    return;
  }

  lead.isArchived = true;
  await lead.save();

  await recordAuditLog({
    action: 'LEAD_ARCHIVED',
    entityType: 'Lead',
    entityId: id,
    req,
  });

  res.json({ success: true, message: 'Lead archived successfully.' });
};

// Lead conversion: atomic transaction with existing contact reuse and deal creation
export const convertLead = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const {
    createDeal = true,
    dealTitle,
    dealValue = 0,
    expectedCloseDate,
    createCompany = true,
    existingContactId,
    existingCompanyId,
  } = req.body;

  const lead = await Lead.findById(id);
  if (!lead) {
    res.status(404).json({ success: false, message: 'Lead not found.' });
    return;
  }

  if (!canAccessRecord(user, lead)) {
    res.status(403).json({ success: false, message: 'Access denied to convert this lead.' });
    return;
  }

  if (lead.status === 'Converted' || lead.convertedContactId) {
    res.status(400).json({
      success: false,
      message: 'This lead has already been converted and cannot be converted twice.',
    });
    return;
  }

  const session = await mongoose.startSession();
  try {
    let result: any = {};

    await session.withTransaction(async () => {
      // 1. Resolve or create Company
      let companyId: any = existingCompanyId || null;
      if (!companyId && createCompany && lead.company) {
        let existingCompany = await Company.findOne({
          name: { $regex: new RegExp(`^${lead.company.trim()}$`, 'i') },
        }).session(session);

        if (!existingCompany) {
          const newCompany = await Company.create(
            [
              {
                name: lead.company.trim(),
                assignedTo: lead.assignedTo,
                teamId: lead.teamId,
                phone: lead.phone,
                notes: `Created from lead conversion (${lead.fullName})`,
              },
            ],
            { session }
          );
          companyId = newCompany[0]._id;
        } else {
          companyId = existingCompany._id;
        }
      }

      // 2. Resolve or create Contact
      let contactId: any = existingContactId || null;
      if (!contactId) {
        let existingContact = await Contact.findOne({
          email: lead.email.toLowerCase(),
        }).session(session);

        if (existingContact) {
          contactId = existingContact._id;
        } else {
          const newContact = await Contact.create(
            [
              {
                name: lead.fullName,
                email: lead.email,
                phone: lead.phone,
                companyId: companyId || null,
                companyName: lead.company,
                assignedTo: lead.assignedTo,
                teamId: lead.teamId,
                sourceLeadId: lead._id,
                notes: lead.notes,
                tags: lead.tags,
              },
            ],
            { session }
          );
          contactId = newContact[0]._id;
        }
      }

      // 3. Create Deal if requested
      let dealId: any = null;
      if (createDeal) {
        const title = dealTitle || `${lead.company || lead.fullName} Deal`;
        const newDeal = await Deal.create(
          [
            {
              title,
              contactId,
              companyId,
              value: {
                amount: Math.max(0, Number(dealValue) || 0),
                currency: 'INR',
              },
              stage: 'Discovery',
              expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
              assignedTo: lead.assignedTo,
              teamId: lead.teamId,
              sourceLeadId: lead._id,
              notes: lead.notes,
              stageHistory: [
                {
                  stage: 'Discovery',
                  changedBy: user._id,
                  changedAt: new Date(),
                  notes: 'Created via lead conversion',
                },
              ],
            },
          ],
          { session }
        );
        dealId = newDeal[0]._id;
      }

      // 4. Update Lead to Converted
      lead.status = 'Converted';
      lead.convertedContactId = contactId;
      lead.convertedCompanyId = companyId;
      lead.convertedDealId = dealId;
      lead.convertedAt = new Date();
      await lead.save({ session });

      // 5. Transfer or link activities to contact and deal
      await Activity.updateMany(
        { relatedType: 'lead', relatedId: lead._id },
        { $set: { notes: `[From Lead Conversion] ` } },
        { session }
      );

      // Record activity on contact
      await Activity.create(
        [
          {
            type: 'Note',
            authorId: user._id,
            relatedType: 'contact',
            relatedId: contactId,
            title: 'Lead Converted',
            notes: `Converted from lead ${lead.fullName}. Deal created: ${createDeal ? 'Yes' : 'No'}`,
          },
        ],
        { session }
      );

      result = { contactId, companyId, dealId };
    });

    await recordAuditLog({
      action: 'LEAD_CONVERTED',
      entityType: 'Lead',
      entityId: id,
      details: { ...result },
      req,
    });

    res.json({
      success: true,
      message: 'Lead converted successfully.',
      data: result,
    });
  } catch (err: any) {
    console.error('[Lead Conversion Error]', err);
    res.status(500).json({ success: false, message: `Conversion failed: ${err.message}` });
  } finally {
    session.endSession();
  }
};

export const exportLeadsCsv = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const scopeFilter = buildRecordScopeFilter(user);
  const filter: any = { ...scopeFilter, isArchived: false };

  const leads = await Lead.find(filter)
    .populate('assignedTo', 'name email')
    .populate('teamId', 'name')
    .sort({ createdAt: -1 });

  // Spreadsheet formula injection protection helper
  const sanitizeCsvValue = (val: any) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).replace(/"/g, '""');
    // Prevent spreadsheet formula injection (=, +, -, @)
    if (/^[=+\-@]/.test(str)) {
      str = `'${str}`;
    }
    return `"${str}"`;
  };

  const headers = [
    'Lead ID',
    'Full Name',
    'Company',
    'Email',
    'Phone',
    'Source',
    'Status',
    'Priority',
    'Assigned To',
    'Team',
    'Next Follow-Up',
    'Created At',
  ];

  const rows = leads.map((l: any) => [
    sanitizeCsvValue(l._id),
    sanitizeCsvValue(l.fullName),
    sanitizeCsvValue(l.company || ''),
    sanitizeCsvValue(l.email),
    sanitizeCsvValue(l.phone || ''),
    sanitizeCsvValue(l.source),
    sanitizeCsvValue(l.status),
    sanitizeCsvValue(l.priority),
    sanitizeCsvValue(l.assignedTo?.name || 'Unassigned'),
    sanitizeCsvValue(l.teamId?.name || 'None'),
    sanitizeCsvValue(l.nextFollowUpDate ? l.nextFollowUpDate.toISOString() : ''),
    sanitizeCsvValue(l.createdAt ? l.createdAt.toISOString() : ''),
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="leads_export_${Date.now()}.csv"`);
  res.send(csvContent);
};
