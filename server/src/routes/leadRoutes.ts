import { Router } from 'express';
import { z } from 'zod';
import {
  listLeads,
  getLeadById,
  createLead,
  updateLead,
  archiveLead,
  convertLead,
  checkDuplicates,
  exportLeadsCsv,
} from '../controllers/leadController';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const leadCreateSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  company: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  source: z.enum(['Website', 'Referral', 'LinkedIn', 'Call', 'Walk-in', 'Other']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  assignedTo: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  nextFollowUpDate: z.string().optional().nullable(),
});

const leadUpdateSchema = z.object({
  fullName: z.string().min(2).optional(),
  company: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  source: z.enum(['Website', 'Referral', 'LinkedIn', 'Call', 'Walk-in', 'Other']).optional(),
  status: z.enum(['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted']).optional(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  assignedTo: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  nextFollowUpDate: z.string().optional().nullable(),
});

const convertLeadSchema = z.object({
  createDeal: z.boolean().optional(),
  dealTitle: z.string().optional(),
  dealValue: z.number().min(0).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  createCompany: z.boolean().optional(),
  existingContactId: z.string().optional().nullable(),
  existingCompanyId: z.string().optional().nullable(),
});

router.get('/', listLeads);
router.get('/duplicates', checkDuplicates);
router.get('/export', exportLeadsCsv);
router.get('/:id', getLeadById);
router.post('/', validateRequest({ body: leadCreateSchema }), createLead);
router.put('/:id', validateRequest({ body: leadUpdateSchema }), updateLead);
router.delete('/:id', archiveLead);
router.post('/:id/convert', validateRequest({ body: convertLeadSchema }), convertLead);

export default router;
