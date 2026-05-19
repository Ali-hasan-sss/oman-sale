import type { Request, Response } from 'express';

import { getRequiredParam } from '../../shared/utils/request';
import { chatService } from './chat.service';

export class ChatController {
  async openConversation(req: Request, res: Response) {
    res.status(201).json({ data: await chatService.openConversation(req.user!.id, req.body) });
  }

  async listConversations(req: Request, res: Response) {
    res.json({ data: await chatService.listConversations(req.user!.id) });
  }

  async unreadCount(req: Request, res: Response) {
    res.json({ data: { count: await chatService.unreadCount(req.user!.id) } });
  }

  async getConversation(req: Request, res: Response) {
    res.json({ data: await chatService.getConversation(getRequiredParam(req, 'conversationId'), req.user!.id) });
  }

  async listMessages(req: Request, res: Response) {
    res.json({ data: await chatService.listMessages(getRequiredParam(req, 'conversationId'), req.user!.id) });
  }

  async sendMessage(req: Request, res: Response) {
    res.status(201).json({ data: await chatService.sendMessage(req.user!.id, req.body) });
  }

  async markRead(req: Request, res: Response) {
    res.json({ data: await chatService.markRead(getRequiredParam(req, 'conversationId'), req.user!.id) });
  }
}

export const chatController = new ChatController();
