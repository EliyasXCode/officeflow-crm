import { Router } from 'express';
import { z } from 'zod';
import {
  listContacts,
  getContactById,
  createContact,
  updateContact,
  archiveContact,
} from '../controllers/contactController';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const contactSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  jobTitle: z.string().optional(),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  companyId: z.string().optional().nullable(),
  companyName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

router.get('/', listContacts);
router.get('/:id', getContactById);
router.post('/', validateRequest({ body: contactSchema }), createContact);
router.put('/:id', validateRequest({ body: contactSchema.partial() }), updateContact);
router.delete('/:id', archiveContact);

export default router;
