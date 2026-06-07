import type { Request, Response } from 'express';

import { executeQuickReply } from './assistant-canned';
import { assistantService } from './assistant.service';
import type { AssistantChatDto } from './assistant.validation';
import type { AssistantQuickReplyDto } from './assistant-canned.validation';

export class AssistantController {
  async chat(req: Request, res: Response) {
    const body = req.body as AssistantChatDto;
    const result = await assistantService.chat({
      ...body,
      isAuthenticated: Boolean(req.user)
    });
    res.json({ data: result });
  }

  async quickReply(req: Request, res: Response) {
    const body = req.body as AssistantQuickReplyDto;
    const result = await executeQuickReply(body.intent, {
      locale: body.locale,
      isAuthenticated: Boolean(req.user)
    });
    res.json({ data: result });
  }
}

export const assistantController = new AssistantController();
