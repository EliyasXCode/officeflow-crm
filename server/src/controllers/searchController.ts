import { Response } from 'express';
import { Lead } from '../models/Lead';
import { Contact } from '../models/Contact';
import { Company } from '../models/Company';
import { Deal } from '../models/Deal';
import { AuthenticatedRequest } from '../types';
import { buildRecordScopeFilter } from '../middlewares/rbac';

export const globalSearch = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const user = req.user!;
  const { q } = req.query;

  if (!q || String(q).trim().length < 2) {
    res.json({ success: true, results: { leads: [], contacts: [], companies: [], deals: [] } });
    return;
  }

  const queryStr = String(q).trim();
  const scopeFilter = buildRecordScopeFilter(user);

  const [leads, contacts, companies, deals] = await Promise.all([
    Lead.find({
      ...scopeFilter,
      isArchived: false,
      $or: [
        { fullName: { $regex: queryStr, $options: 'i' } },
        { company: { $regex: queryStr, $options: 'i' } },
        { email: { $regex: queryStr, $options: 'i' } },
      ],
    })
      .select('fullName company email status')
      .limit(5),

    Contact.find({
      ...scopeFilter,
      isArchived: false,
      $or: [
        { name: { $regex: queryStr, $options: 'i' } },
        { email: { $regex: queryStr, $options: 'i' } },
        { companyName: { $regex: queryStr, $options: 'i' } },
      ],
    })
      .select('name jobTitle email companyName')
      .limit(5),

    Company.find({
      ...scopeFilter,
      isArchived: false,
      $or: [
        { name: { $regex: queryStr, $options: 'i' } },
        { industry: { $regex: queryStr, $options: 'i' } },
      ],
    })
      .select('name industry website')
      .limit(5),

    Deal.find({
      ...scopeFilter,
      isArchived: false,
      title: { $regex: queryStr, $options: 'i' },
    })
      .select('title value stage')
      .limit(5),
  ]);

  res.json({
    success: true,
    results: {
      leads,
      contacts,
      companies,
      deals,
    },
  });
};
