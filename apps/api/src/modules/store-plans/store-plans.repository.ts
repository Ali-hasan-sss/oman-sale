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

type StorePlanWriteData = Omit<
  CreateStorePlanDto,
  | 'oneMonthPrice'
  | 'oneMonthMaxListings'
  | 'twoMonthsPrice'
  | 'twoMonthsMaxListings'
  | 'threeMonthsPrice'
  | 'threeMonthsMaxListings'
>;

type StorePlanUpdateData = Omit<
  UpdateStorePlanDto,
  | 'oneMonthPrice'
  | 'oneMonthMaxListings'
  | 'twoMonthsPrice'
  | 'twoMonthsMaxListings'
  | 'threeMonthsPrice'
  | 'threeMonthsMaxListings'
>;

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

  listRootCategories() {
    return prisma.category.findMany({
      where: { parentId: null, deletedAt: null },
      select: { id: true, nameAr: true, nameEn: true, slug: true, parentId: true },
      orderBy: [{ sortOrder: 'asc' }, { nameAr: 'asc' }]
    });
  }

  async syncPricingForAllRootCategories(
    planId: string,
    dto: Pick<
      BulkUpsertStorePlanPricingDto,
      | 'oneMonthPrice'
      | 'oneMonthMaxListings'
      | 'twoMonthsPrice'
      | 'twoMonthsMaxListings'
      | 'threeMonthsPrice'
      | 'threeMonthsMaxListings'
    >
  ) {
    const categories = await this.listRootCategories();

    await Promise.all(
      categories.map((category) =>
        this.bulkUpsertPricing(planId, {
          categoryId: category.id,
          oneMonthPrice: dto.oneMonthPrice,
          oneMonthMaxListings: dto.oneMonthMaxListings,
          twoMonthsPrice: dto.twoMonthsPrice,
          twoMonthsMaxListings: dto.twoMonthsMaxListings,
          threeMonthsPrice: dto.threeMonthsPrice,
          threeMonthsMaxListings: dto.threeMonthsMaxListings
        })
      )
    );
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

  createPlan(dto: StorePlanWriteData) {
    return prisma.storeSubscriptionPlan.create({ data: dto });
  }

  updatePlan(id: string, dto: StorePlanUpdateData) {
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
    const [oneMonth, twoMonths, threeMonths] = await Promise.all([
      this.upsertPricing(planId, {
        categoryId: dto.categoryId,
        billingPeriod: StoreBillingPeriod.ONE_MONTH,
        price: dto.oneMonthPrice,
        maxListings: dto.oneMonthMaxListings
      }),
      this.upsertPricing(planId, {
        categoryId: dto.categoryId,
        billingPeriod: StoreBillingPeriod.TWO_MONTHS,
        price: dto.twoMonthsPrice,
        maxListings: dto.twoMonthsMaxListings
      }),
      this.upsertPricing(planId, {
        categoryId: dto.categoryId,
        billingPeriod: StoreBillingPeriod.THREE_MONTHS,
        price: dto.threeMonthsPrice,
        maxListings: dto.threeMonthsMaxListings
      })
    ]);

    return { oneMonth, twoMonths, threeMonths };
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
