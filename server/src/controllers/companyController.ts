import { Response } from 'express';
import { Company } from '../models/Company';
import { Contact } from '../models/Contact';
import { Deal } from '../models/Deal';
import { AuthenticatedRequest } from '../types';
import { buildRecordScopeFilter, canAccessRecord } from '../middlewares/rbac';
import { recordAuditLog } from '../utils/audit';

export const listCompanies = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { page = '1', limit = '15', search, industry } = req.query;

  const scopeFilter = buildRecordScopeFilter(user);
  const filter: any = { ...scopeFilter, isArchived: false };

  if (industry) filter.industry = industry;

  if (search) {
    const s = String(search).trim();
    filter.$or = [
      { name: { $regex: s, $options: 'i' } },
      { industry: { $regex: s, $options: 'i' } },
      { phone: { $regex: s, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page as string, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [companies, total] = await Promise.all([
    Company.find(filter)
      .populate('assignedTo', 'name email')
      .populate('teamId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    Company.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: companies,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
};

export const getCompanyById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const company = await Company.findById(id)
    .populate('assignedTo', 'name email role')
    .populate('teamId', 'name');

  if (!company || company.isArchived) {
    res.status(404).json({ success: false, message: 'Company not found.' });
    return;
  }

  if (!canAccessRecord(user, company)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  const [contacts, deals] = await Promise.all([
    Contact.find({ companyId: company._id, isArchived: false }).sort({ name: 1 }),
    Deal.find({ companyId: company._id, isArchived: false }).sort({ createdAt: -1 }),
  ]);

  res.json({
    success: true,
    data: company,
    related: { contacts, deals },
  });
};

export const createCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { name, industry, website, phone, address, notes } = req.body;

  const company = await Company.create({
    name: name.trim(),
    industry: industry?.trim(),
    website: website?.trim(),
    phone: phone?.trim(),
    address,
    assignedTo: user._id,
    teamId: user.teamId || null,
    notes: notes?.trim(),
  });

  await recordAuditLog({
    action: 'COMPANY_CREATED',
    entityType: 'Company',
    entityId: (company._id as any).toString(),
    details: { name: company.name },
    req,
  });

  res.status(201).json({
    success: true,
    message: 'Company created successfully.',
    data: company,
  });
};

export const updateCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;
  const { name, industry, website, phone, address, notes } = req.body;

  const company = await Company.findById(id);
  if (!company || company.isArchived) {
    res.status(404).json({ success: false, message: 'Company not found.' });
    return;
  }

  if (!canAccessRecord(user, company)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  if (name !== undefined) company.name = name.trim();
  if (industry !== undefined) company.industry = industry.trim();
  if (website !== undefined) company.website = website.trim();
  if (phone !== undefined) company.phone = phone.trim();
  if (address !== undefined) company.address = address;
  if (notes !== undefined) company.notes = notes.trim();

  await company.save();

  await recordAuditLog({
    action: 'COMPANY_UPDATED',
    entityType: 'Company',
    entityId: id,
    req,
  });

  res.json({
    success: true,
    message: 'Company updated successfully.',
    data: company,
  });
};

export const archiveCompany = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = req.user!;

  const company = await Company.findById(id);
  if (!company) {
    res.status(404).json({ success: false, message: 'Company not found.' });
    return;
  }

  if (!canAccessRecord(user, company)) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  company.isArchived = true;
  await company.save();

  await recordAuditLog({
    action: 'COMPANY_ARCHIVED',
    entityType: 'Company',
    entityId: id,
    req,
  });

  res.json({ success: true, message: 'Company archived successfully.' });
};
