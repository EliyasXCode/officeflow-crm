import { Router } from 'express';
import { z } from 'zod';
import { getSettings, updateSettings, getAuditLogs } from '../controllers/settingsController';
import { requireAuth } from '../middlewares/auth';
import { requireRoles } from '../middlewares/rbac';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const settingsUpdateSchema = z.object({
  officeName: z.string().min(2).optional(),
  currency: z.string().min(3).max(3).optional(),
  timezone: z.string().optional(),
  allowedLeadSources: z.array(z.string()).optional(),
  pipelineStages: z.array(z.string()).optional(),
});

// Settings & Audit access is strictly restricted to Admins
router.get('/', requireRoles('admin'), getSettings);
router.put('/', requireRoles('admin'), validateRequest({ body: settingsUpdateSchema }), updateSettings);
router.get('/audit', requireRoles('admin'), getAuditLogs);

export default router;
