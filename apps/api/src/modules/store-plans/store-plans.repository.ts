import { StoreBillingPeriod } from '@prisma/client';

import { prisma } from '../../shared/prisma/client';
import type {
  BulkUpsertStorePlanPricingDto,
  CreateStorePlanDto,
  ListStorePlansQuery,
  UpdateStorePlanDiscountDto,
  UpdateStorePlanDto,
  UpsertStorePlanPricingDto
} from './store-plans.validation';

export class StorePlansRepository {
  listPlans(query: ListStorePlansQuery) {
    return prisma.storeSubscriptionPlan.findMany({
      where: {
        deletedAt: null,
        ...(!query.includeInactive && { isActive: true })
      },
      include: {
        promotionPlan: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            badgeLabel: true,
            color: true,
            isActive: true
          }
        },
        pricing: {
          where: {
            deletedAt: null,
            ...(query.categoryId && { categoryId: query.categoryId })
          },
          include: {
            category: {
              select: { id: true, nameAr: true, nameEn: true, slug: true, parentId: true }
            }
          },
          orderBy: [{ categoryId: 'asc' }, { billingPeriod: 'asc' }]
        }
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }]
    });
  }

  findPlanById(id: string) {
    return prisma.storeSubscriptionPlan.findFirst({
      where: { id, deletedAt: null },
      include: {
        promotionPlan: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            badgeLabel: true,
            color: true,
            isActive: true
          }
        },
        pricing: {
          where: { deletedAt: null },
          include: {
            category: {
              select: { id: true, nameAr: true, nameEn: true, slug: true, parentId: true }
            }
          },
          orderBy: [{ categoryId: 'asc' }, { billingPeriod: 'asc' }]
        }
      }
    });
  }

  createPlan(dto: CreateStorePlanDto) {
    return prisma.storeSubscriptionPlan.create({ data: dto });
  }

  updatePlan(id: string, dto: UpdateStorePlanDto) {
    return prisma.storeSubscriptionPlan.update({ where: { id }, data: dto });
  }

  updatePlanDiscount(id: string, dto: UpdateStorePlanDiscountDto) {
    return prisma.storeSubscriptionPlan.update({
      where: { id },
      data: {
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.isDiscountActive !== undefined && { isDiscountActive: dto.isDiscountActive }),
        ...(dto.isDiscountActive === false && { discountType: 'NONE', discountValue: 0 })
      }
    });
  }

  softDeletePlan(id: string) {
    return prisma.storeSubscriptionPlan.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false }
    });
  }

  findPricingById(id: string) {
    return prisma.storePlanPricing.findFirst({
      where: { id, deletedAt: null },
      include: {
        plan: true,
        category: { select: { id: true, parentId: true, nameAr: true, nameEn: true } }
      }
    });
  }

  upsertPricing(planId: string, dto: UpsertStorePlanPricingDto) {
    return prisma.storePlanPricing.upsert({
      where: {
        planId_categoryId_billingPeriod: {
          planId,
          categoryId: dto.categoryId,
          billingPeriod: dto.billingPeriod
        }
      },
      update: {
        price: dto.price,
        maxListings: dto.maxListings,
        deletedAt: null
      },
      create: {
        planId,
        categoryId: dto.categoryId,
        billingPeriod: dto.billingPeriod,
        price: dto.price,
        maxListings: dto.maxListings
      }
    });
  }

  async bulkUpsertPricing(planId: string, dto: BulkUpsertStorePlanPricingDto) {
    const [monthly, yearly] = await Promise.all([
      this.upsertPricing(planId, {
        categoryId: dto.categoryId,
        billingPeriod: StoreBillingPeriod.MONTHLY,
        price: dto.monthlyPrice,
        maxListings: dto.monthlyMaxListings
      }),
      this.upsertPricing(planId, {
        categoryId: dto.categoryId,
        billingPeriod: StoreBillingPeriod.YEARLY,
        price: dto.yearlyPrice,
        maxListings: dto.yearlyMaxListings
      })
    ]);

    return { monthly, yearly };
  }

  updatePricingDiscount(pricingId: string, dto: UpdateStorePlanDiscountDto) {
    return prisma.storePlanPricing.update({
      where: { id: pricingId },
      data: {
        ...(dto.discountType !== undefined && { discountType: dto.discountType }),
        ...(dto.discountValue !== undefined && { discountValue: dto.discountValue }),
        ...(dto.isDiscountActive !== undefined && { isDiscountActive: dto.isDiscountActive }),
        ...(dto.isDiscountActive === false && { discountType: 'NONE', discountValue: 0 })
      }
    });
  }

  softDeletePricing(pricingId: string) {
    return prisma.storePlanPricing.update({
      where: { id: pricingId },
      data: { deletedAt: new Date() }
    });
  }
}

export const storePlansRepository = new StorePlansRepository();
