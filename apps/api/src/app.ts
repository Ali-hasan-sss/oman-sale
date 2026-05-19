import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { corsOptions } from './config/cors';
import { env } from './config/env';
import { adminRoutes } from './modules/admin/admin.routes';
import { adsRoutes } from './modules/ads/ads.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { categoriesRoutes } from './modules/categories/categories.routes';
import { heroRoutes } from './modules/hero/hero.routes';
import { chatRoutes } from './modules/chat/chat.routes';
import { notificationsRoutes } from './modules/notifications/notifications.routes';
import { paymentsRoutes } from './modules/payments/payments.routes';
import { promotionsRoutes } from './modules/promotions/promotions.routes';
import { searchRoutes } from './modules/search/search.routes';
import { tourismRoutes } from './modules/tourism/tourism.routes';
import { usersRoutes } from './modules/users/users.routes';
import { errorHandler } from './shared/middleware/error-handler';
import { notFoundHandler } from './shared/middleware/not-found';
import { apiRateLimiter } from './shared/middleware/rate-limit';

export const app = express();

app.set('trust proxy', env.TRUST_PROXY);

app.use(
  helmet(
    env.NODE_ENV === 'development'
      ? { crossOriginResourcePolicy: { policy: 'cross-origin' } }
      : undefined
  )
);
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'oman-sale-api' });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', usersRoutes);
app.use('/api/v1/ads', adsRoutes);
app.use('/api/v1/categories', categoriesRoutes);
app.use('/api/v1/hero', heroRoutes);
app.use('/api/v1/payments', paymentsRoutes);
app.use('/api/v1/promotions', promotionsRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/notifications', notificationsRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/tourism', tourismRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
