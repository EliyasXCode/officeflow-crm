import { Router } from 'express';
import { listNotifications, markAsRead, markAllAsRead } from '../controllers/notificationController';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.use(requireAuth);

router.get('/', listNotifications);
router.put('/:id/read', markAsRead);
router.put('/read-all', markAllAsRead);

export default router;
