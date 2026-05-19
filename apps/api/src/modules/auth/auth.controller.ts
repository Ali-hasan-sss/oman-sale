import type { Request, Response } from 'express';

import { authService } from './auth.service';

export class AuthController {
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
}

export const authController = new AuthController();
