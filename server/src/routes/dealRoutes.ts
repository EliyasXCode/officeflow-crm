import { Router } from 'express';
import { z } from 'zod';
import {
  listDeals,
  getDealById,
  createDeal,
  updateDeal,
  updateDealStage,
  archiveDeal,
} from '../controllers/dealController';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const dealCreateSchema = z.object({
  title: z.string().min(2, 'Deal title is required'),
  contactId: z.string().optional().nullable(),
  companyId: z.string().optional().nullable(),
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: z.string().default('INR'),
  stage: z.enum(['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost']).optional(),
  expectedCloseDate: z.string().optional().nullable(),
  assignedTo: z.string().optional().nullable(),
  notes: z.string().optional(),
});

const dealStageUpdateSchema = z.object({
  stage: z.enum(['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost']),
  notes: z.string().optional(),
  lostReason: z.string().optional(),
});

router.get('/', listDeals);
router.get('/:id', getDealById);
router.post('/', validateRequest({ body: dealCreateSchema }), createDeal);
router.put('/:id/stage', validateRequest({ body: dealStageUpdateSchema }), updateDealStage);
router.put('/:id', updateDeal);
router.delete('/:id', archiveDeal);

export default router;
