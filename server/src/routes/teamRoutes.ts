import { Router } from 'express';
import { z } from 'zod';
import { listTeams, createTeam, updateTeam, getTeamMembersWithWorkload } from '../controllers/teamController';
import { requireAuth } from '../middlewares/auth';
import { requireRoles } from '../middlewares/rbac';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const teamCreateSchema = z.object({
  name: z.string().min(2, 'Team name is required'),
  description: z.string().optional(),
  managerId: z.string().optional().nullable(),
});

const teamUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  managerId: z.string().optional().nullable(),
});

router.get('/', listTeams);
router.post('/', requireRoles('admin'), validateRequest({ body: teamCreateSchema }), createTeam);
router.put('/:id', requireRoles('admin'), validateRequest({ body: teamUpdateSchema }), updateTeam);
router.get('/:id/members', requireRoles('admin', 'manager'), getTeamMembersWithWorkload);

export default router;
