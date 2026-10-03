import { Router } from 'express';
import { z } from 'zod';
import {
  listCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  archiveCompany,
} from '../controllers/companyController';
import { requireAuth } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';

const router = Router();

router.use(requireAuth);

const companySchema = z.object({
  name: z.string().min(2, 'Company name is required'),
  industry: z.string().optional(),
  website: z.string().optional(),
  phone: z.string().optional(),
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postalCode: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  notes: z.string().optional(),
});

router.get('/', listCompanies);
router.get('/:id', getCompanyById);
router.post('/', validateRequest({ body: companySchema }), createCompany);
router.put('/:id', validateRequest({ body: companySchema.partial() }), updateCompany);
router.delete('/:id', archiveCompany);

export default router;
