import { Router } from 'express';
import { UserRole } from '@prisma/client';

import { authorize, requireAuth } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/validators/validate-request';
import { asyncHandler } from '../../shared/utils/async-handler';
import { authController } from './auth.controller';
import {
  changePasswordSchema,
  emailCodeSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  resendVerificationSchema,
  resetPasswordSchema
} from './auth.validation';

export const authRoutes = Router();

authRoutes.post(
  '/register',
  validateRequest({ body: registerSchema }),
  asyncHandler(authController.register)
);

authRoutes.post('/login', validateRequest({ body: loginSchema }), asyncHandler(authController.login));
authRoutes.post(
  '/admin/login',
  validateRequest({ body: loginSchema }),
  asyncHandler(authController.adminLogin)
);
authRoutes.post(
  '/refresh',
  validateRequest({ body: refreshTokenSchema }),
  asyncHandler(authController.refresh)
);
authRoutes.post('/verify-email', validateRequest({ body: emailCodeSchema }), asyncHandler(authController.verifyEmail));
authRoutes.post('/resend-verification', validateRequest({ body: resendVerificationSchema }), asyncHandler(authController.resendVerification));
authRoutes.post('/forgot-password', validateRequest({ body: forgotPasswordSchema }), asyncHandler(authController.forgotPassword));
authRoutes.post('/reset-password', validateRequest({ body: resetPasswordSchema }), asyncHandler(authController.resetPassword));
authRoutes.post(
  '/admin/change-password',
  requireAuth,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  validateRequest({ body: changePasswordSchema }),
  asyncHandler(authController.changePassword)
);
