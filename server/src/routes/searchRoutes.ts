import { Router } from 'express';
import { globalSearch } from '../controllers/searchController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', globalSearch);

export default router;
