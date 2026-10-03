import { Router } from 'express';
import { z } from 'zod';
import { listUsers, inviteUser, updateUser, deactivateUser } from '../controllers/userController';
import { requireAuth } from '../middlewares/auth';
import { requireRoles } from '../middlewares/rbac';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const inviteSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['admin', 'manager', 'employee']),
  teamId: z.string().optional().nullable(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  role: z.enum(['admin', 'manager', 'employee']).optional(),
  teamId: z.string().optional().nullable(),
  jobTitle: z.string().optional(),
  phone: z.string().optional(),
});

const deactivateSchema = z.object({
  reassignToUserId: z.string().optional(),
});

// All authenticated users can list users scoped to their role/team
router.get('/', listUsers);

// Only admins can invite, edit or deactivate employees
router.post('/invite', requireRoles('admin'), validateRequest({ body: inviteSchema }), inviteUser);
router.put('/:id', requireRoles('admin'), validateRequest({ body: updateSchema }), updateUser);
router.post('/:id/deactivate', requireRoles('admin'), validateRequest({ body: deactivateSchema }), deactivateUser);

export default router;
