import { Response } from 'express';
import { Contact } from '../models/Contact';
import { Deal } from '../models/Deal';
import { Task } from '../models/Task';
import { Activity } from '../models/Activity';
import { AuthenticatedRequest } from '../types';
import { buildRecordScopeFilter, canAccessRecord } from '../middlewares/rbac';
import { recordAuditLog } from '../utils/audit';

export const listContacts = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { page = '1', limit = '15', search, companyId } = req.query;

  const scopeFilter = buildRecordScopeFilter(user);
  const filter: any = { ...scopeFilter, isArchived: false };

  if (companyId) filter.companyId = companyId;

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { email: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
      { companyName: { $regex: s, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [contacts, total] = await Promise.all([
    Contact.find(filter)
      .populate('companyId', 'name industry')
      .populate('assignedTo', 'name email')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Contact.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: contacts,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getContactById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const contact = await Contact.findById(id)
    .populate('companyId')
    .populate('assignedTo', 'name email role')
    .populate('teamId', 'name')
    .populate('sourceLeadId', 'fullName status');

  if (!contact || contact.isArchived) {
    res.status(404).json({ success: false, message: 'Contact not found.' });
    return;
  }

  if (!canAccessRecord(user, contact)) {
    res.status(403).json({ success: false, message: 'Access denied to this contact.' });
    return;
  }

  const [deals, tasks, activities] = await Promise.all([
    Deal.find({ contactId: contact._id, isArchived: false }).sort({ createdAt: -1 }),
    Task.find({ relatedType: 'contact', relatedId: contact._id }).sort({ dueDate: 1 }),
    Activity.find({ relatedType: 'contact', relatedId: contact._id })
      .populate('authorId', 'name email')
      .sort({ createdAt: -1 }),
  ]);

  res.json({
    success: true,
    data: contact,
    related: { deals, tasks, activities },
  });
};

export const createContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { name, jobTitle, email, phone, companyId, companyName, tags, notes } = req.body;

  const contact = await Contact.create({
    name: name.trim(),
    jobTitle: jobTitle?.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim(),
    companyId: companyId || null,
    companyName: companyName?.trim(),
    assignedTo: user._id,
    teamId: user.teamId || null,
    tags: Array.isArray(tags) ? tags : [],
    notes: notes?.trim(),
  });

  await recordAuditLog({
    action: 'CONTACT_CREATED',
    entityType: 'Contact',
    entityId: (contact._id as any).toString(),
    details: { name: contact.name, email: contact.email },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Contact created successfully.',
    data: contact,
  });
};

export const updateContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const { name, jobTitle, email, phone, companyId, companyName, tags, notes } = req.body;

  const contact = await Contact.findById(id);
  if (!contact || contact.isArchived) {
    res.status(404).json({ success: false, message: 'Contact not found.' });
    return;
  }

  if (!canAccessRecord(user, contact)) {
    res.status(403).json({ success: false, message: 'Access denied to update this contact.' });
    return;
  }

  if (name !== undefined) contact.name = name.trim();
  if (jobTitle !== undefined) contact.jobTitle = jobTitle?.trim();
  if (email !== undefined) contact.email = email.trim().toLowerCase();
  if (phone !== undefined) contact.phone = phone?.trim();
  if (companyId !== undefined) contact.companyId = companyId || null;
  if (companyName !== undefined) contact.companyName = companyName?.trim();
  if (tags !== undefined) contact.tags = Array.isArray(tags) ? tags : [];
  if (notes !== undefined) contact.notes = notes?.trim();

  await contact.save();

  await recordAuditLog({
    action: 'CONTACT_UPDATED',
    entityType: 'Contact',
    entityId: id,
    req,
  });

  res.json({
    success: true,
    message: 'Contact updated successfully.',
    data: contact,
  });
};

export const archiveContact = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const contact = await Contact.findById(id);
  if (!contact) {
    res.status(404).json({ success: false, message: 'Contact not found.' });
    return;
  }

  if (!canAccessRecord(user, contact)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  contact.isArchived = true;
  await contact.save();

  await recordAuditLog({
    action: 'CONTACT_ARCHIVED',
    entityType: 'Contact',
    entityId: id,
    req,
  });

  res.json({ success: true, message: 'Contact archived successfully.' });
};
