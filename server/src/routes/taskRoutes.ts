import { Router } from 'express';
import { z } from 'zod';
import {
  listTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
} from '../controllers/taskController';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const taskCreateSchema = z.object({
  title: z.string().min(2, 'Task title is required'),
  description: z.string().optional(),
  assignedTo: z.string().optional().nullable(),
  priority: z.enum(['Low', 'Medium', 'High']).optional(),
  dueDate: z.string().min(1, 'Due date is required'),
  relatedType: z.enum(['lead', 'contact', 'deal', 'company']).optional().nullable(),
  relatedId: z.string().optional().nullable(),
});

const taskStatusSchema = z.object({
  status: z.enum(['To Do', 'In Progress', 'Done']),
});

router.get('/', listTasks);
router.post('/', validateRequest({ body: taskCreateSchema }), createTask);
router.put('/:id', updateTask);
router.put('/:id/status', validateRequest({ body: taskStatusSchema }), updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;
