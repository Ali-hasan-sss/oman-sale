import { paymentsRepository } from './payments.repository';
import type { CreatePaymentDto } from './payments.validation';

export class PaymentsService {
  create(userId: string, dto: CreatePaymentDto) {
    return paymentsRepository.create(userId, dto);
  }

  listForUser(userId: string) {
    return paymentsRepository.listForUser(userId);
  }
}

export const paymentsService = new PaymentsService();
