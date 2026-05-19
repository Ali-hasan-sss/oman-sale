import { prisma } from '../../shared/prisma/client';
import type { CreatePaymentDto } from './payments.validation';

export class PaymentsRepository {
  create(userId: string, dto: CreatePaymentDto) {
    return prisma.payment.create({
      data: { userId, amount: dto.amount, provider: dto.provider, adId: dto.adId, promotionId: dto.promotionId }
    });
  }

  listForUser(userId: string) {
    return prisma.payment.findMany({ where: { userId, deletedAt: null }, orderBy: { createdAt: 'desc' } });
  }
}

export const paymentsRepository = new PaymentsRepository();
