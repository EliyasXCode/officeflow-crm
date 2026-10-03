import { Router } from 'express';
import { getReportsData, exportReportsCsv } from '../controllers/reportController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', getReportsData);
router.get('/export', exportReportsCsv);

export default router;
