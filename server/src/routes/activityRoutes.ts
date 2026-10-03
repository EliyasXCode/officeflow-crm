import { Router } from 'express';
import { z } from 'zod';
import { listActivities, createActivity, getCalendarEvents } from '../controllers/activityController';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const activitySchema = z.object({
  type: z.enum(['Call', 'Meeting', 'Email', 'Note', 'Follow-up']),
  relatedType: z.enum(['lead', 'contact', 'deal', 'company']),
  relatedId: z.string().min(1, 'Related entity ID is required'),
  title: z.string().min(1, 'Title is required'),
  notes: z.string().optional(),
  outcome: z.string().optional(),
  scheduledAt: z.string().optional().nullable(),
});

router.get('/', listActivities);
router.get('/calendar', getCalendarEvents);
router.post('/', validateRequest({ body: activitySchema }), createActivity);

export default router;
