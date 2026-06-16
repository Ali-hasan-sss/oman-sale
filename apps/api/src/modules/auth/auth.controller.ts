import type { Request, Response } from 'express';

import { authService } from './auth.service';

export class AuthController {
  async registerStart(req: Request, res: Response) {
    const result = await authService.registerStart(req.body);
    return res.status(201).json({ data: result });
  }

  async registerVerifyEmail(req: Request, res: Response) {
    const result = await authService.registerVerifyEmail(req.body);
    return res.json({ data: result });
  }

  async registerResendEmail(req: Request, res: Response) {
    const result = await authService.registerResendEmail(req.body);
    return res.json({ data: result });
  }

  async registerSendPhoneCode(req: Request, res: Response) {
    const result = await authService.registerSendPhoneCode(req.body);
    return res.json({ data: result });
  }

  async registerVerifyPhone(req: Request, res: Response) {
    const result = await authService.registerVerifyPhone(req.body);
    return res.json({ data: result });
  }

  async registerResendPhone(req: Request, res: Response) {
    const result = await authService.registerResendPhone(req.body);
    return res.json({ data: result });
  }

  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    return res.status(201).json({ data: result });
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    return res.json({ data: result });
  }

  async adminLogin(req: Request, res: Response) {
    const result = await authService.adminLogin(req.body);
    return res.json({ data: result });
  }

  async refresh(req: Request, res: Response) {
    const result = await authService.refresh(req.body);
    return res.json({ data: result });
  }

  async verifyEmail(req: Request, res: Response) {
    const result = await authService.verifyEmail(req.body);
    return res.json({ data: result });
  }

  async resendVerification(req: Request, res: Response) {
    const result = await authService.resendVerification(req.body);
    return res.json({ data: result });
  }

  async forgotPassword(req: Request, res: Response) {
    const result = await authService.forgotPassword(req.body);
    return res.json({ data: result });
  }

  async resetPassword(req: Request, res: Response) {
    const result = await authService.resetPassword(req.body);
    return res.json({ data: result });
  }

  async changePassword(req: Request, res: Response) {
    const result = await authService.changePassword(req.user!.id, req.body);
    return res.json({ data: result });
  }

  async googleAuth(req: Request, res: Response) {
    const result = await authService.googleAuth(req.body);
    return res.json({ data: result });
  }

  async completeProfileSendPhone(req: Request, res: Response) {
    const result = await authService.completeProfileSendPhone(req.user!.id, req.body);
    return res.json({ data: result });
  }

  async completeProfileVerifyPhone(req: Request, res: Response) {
    const result = await authService.completeProfileVerifyPhone(req.user!.id, req.body);
    return res.json({ data: result });
  }

  async completeProfile(req: Request, res: Response) {
    const result = await authService.completeProfile(req.user!.id, req.body);
    return res.json({ data: result });
  }
}

export const authController = new AuthController();
