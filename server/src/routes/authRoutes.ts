import { Router } from 'express';
import { z } from 'zod';
import { login, logout, getMe, acceptInvite } from '../controllers/authController';
import { requireAuth } from '../middlewares/auth';
import { authRateLimiter } from '../middlewares/rateLimiter';
import { validateRequest } from '../middlewares/validate';

const router = Router();

const loginSchema = z.object({
  email: z.string().email('Valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const acceptInviteSchema = z.object({
  inviteToken: z.string().min(10, 'Invitation token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

router.post('/login', authRateLimiter, validateRequest({ body: loginSchema }), login);
router.post('/logout', requireAuth, logout);
router.get('/me', requireAuth, getMe);
router.post('/accept-invite', authRateLimiter, validateRequest({ body: acceptInviteSchema }), acceptInvite);

export default router;
