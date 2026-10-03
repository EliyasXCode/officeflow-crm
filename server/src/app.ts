import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ENV } from './config/env';
import { apiRateLimiter } from './middlewares/rateLimiter';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import teamRoutes from './routes/teamRoutes';
import leadRoutes from './routes/leadRoutes';
import contactRoutes from './routes/contactRoutes';
import companyRoutes from './routes/companyRoutes';
import dealRoutes from './routes/dealRoutes';
import taskRoutes from './routes/taskRoutes';
import activityRoutes from './routes/activityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import reportRoutes from './routes/reportRoutes';
import searchRoutes from './routes/searchRoutes';
import settingsRoutes from './routes/settingsRoutes';
import aiRoutes from './routes/aiRoutes';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin) return callback(null, true);
      const allowed = [ENV.CORS_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'];
      if (allowed.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Dev flexible fallback
    },
    credentials: true,
  })
);

app.use(cookieParser(ENV.SESSION_SECRET));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Global API rate limiter
app.use('/api', apiRateLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'OfficeFlow CRM API',
    environment: ENV.NODE_ENV,
    office: {
      currency: ENV.DEFAULT_CURRENCY,
      timezone: ENV.DEFAULT_OFFICE_TIMEZONE,
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ai', aiRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
});

export default app;
