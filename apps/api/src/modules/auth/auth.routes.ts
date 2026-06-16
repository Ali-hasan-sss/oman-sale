import { Router } from 'express';
import { UserRole } from '@prisma/client';

import { authorize, requireAuth } from '../../shared/middleware/auth';
import { validateRequest } from '../../shared/validators/validate-request';
import { asyncHandler } from '../../shared/utils/async-handler';
import { authController } from './auth.controller';
import {
  changePasswordSchema,
  completeProfilePhoneSchema,
  completeProfilePhoneVerifySchema,
  completeProfileSchema,
  emailCodeSchema,
  forgotPasswordSchema,
  googleAuthSchema,
  loginSchema,
  phoneCodeSchema,
  refreshTokenSchema,
  registerCompleteSchema,
  registerPhoneSchema,
  registerStartSchema,
  resendVerificationSchema,
  resetPasswordSchema
} from './auth.validation';

export const authRoutes = Router();

authRoutes.post(
  '/register/start',
  validateRequest({ body: registerStartSchema }),
  asyncHandler(authController.registerStart)
);
authRoutes.post(
  '/register/verify-email',
  validateRequest({ body: emailCodeSchema }),
  asyncHandler(authController.registerVerifyEmail)
);
authRoutes.post(
  '/register/resend-email',
  validateRequest({ body: resendVerificationSchema }),
  asyncHandler(authController.registerResendEmail)
);
authRoutes.post(
  '/register/send-phone-code',
  validateRequest({ body: registerPhoneSchema }),
  asyncHandler(authController.registerSendPhoneCode)
);
authRoutes.post(
  '/register/verify-phone',
  validateRequest({ body: phoneCodeSchema }),
  asyncHandler(authController.registerVerifyPhone)
);
authRoutes.post(
  '/register/resend-phone',
  validateRequest({ body: registerPhoneSchema }),
  asyncHandler(authController.registerResendPhone)
);
authRoutes.post(
  '/register',
  validateRequest({ body: registerCompleteSchema }),
  asyncHandler(authController.register)
);

authRoutes.post('/login', validateRequest({ body: loginSchema }), asyncHandler(authController.login));
authRoutes.post('/google', validateRequest({ body: googleAuthSchema }), asyncHandler(authController.googleAuth));
authRoutes.post(
  '/complete-profile/send-phone',
  requireAuth,
  validateRequest({ body: completeProfilePhoneSchema }),
  asyncHandler(authController.completeProfileSendPhone)
);
authRoutes.post(
  '/complete-profile/verify-phone',
  requireAuth,
  validateRequest({ body: completeProfilePhoneVerifySchema }),
  asyncHandler(authController.completeProfileVerifyPhone)
);
authRoutes.post(
  '/complete-profile',
  requireAuth,
  validateRequest({ body: completeProfileSchema }),
  asyncHandler(authController.completeProfile)
);
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
