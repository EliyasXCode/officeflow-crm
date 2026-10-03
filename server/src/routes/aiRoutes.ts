import { Router } from 'express';
import { z } from 'zod';
import { getAiStatus, summarizeCustomerActivity, draftFollowUpEmail } from '../controllers/aiController';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const summarizeSchema = z.object({
  entityType: z.enum(['lead', 'contact']),
  entityId: z.string().min(1),
});

const draftSchema = z.object({
  entityType: z.enum(['lead', 'contact']),
  entityId: z.string().min(1),
  topic: z.string().optional(),
});

router.get('/status', getAiStatus);
router.post('/summarize', validateRequest({ body: summarizeSchema }), summarizeCustomerActivity);
router.post('/draft-email', validateRequest({ body: draftSchema }), draftFollowUpEmail);

export default router;
