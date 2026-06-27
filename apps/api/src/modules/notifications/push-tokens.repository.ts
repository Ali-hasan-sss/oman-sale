import type { PushPlatform } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';

export class PushTokensRepository {
  upsert(userId: string, token: string, platform: PushPlatform) {
    return prisma.pushToken.upsert({
      where: { userId_token: { userId, token } },
      create: { userId, token, platform },
      update: { platform, updatedAt: new Date() }
    });
  }

  listForUser(userId: string) {
    return prisma.pushToken.findMany({
      where: { userId },
      select: { id: true, token: true, platform: true }
    });
  }

  remove(userId: string, token: string) {
    return prisma.pushToken.deleteMany({ where: { userId, token } });
  }

  removeTokens(tokens: string[]) {
    if (tokens.length === 0) return Promise.resolve({ count: 0 });
    return prisma.pushToken.deleteMany({ where: { token: { in: tokens } } });
  }
}

export const pushTokensRepository = new PushTokensRepository();
