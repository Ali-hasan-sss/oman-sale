import { StoreDiscountType } from '@prisma/client';

import { ApiError } from '../../shared/utils/api-error';
import { categoriesRepository } from '../categories/categories.repository';
import { promotionsRepository } from '../promotions/promotions.repository';
import { storePlansRepository } from './store-plans.repository';
import { withComputedPricing, type PricingRow } from './store-plan-pricing.utils';
import type {
  BulkUpsertStorePlanPricingDto,
  CreateStorePlanDto,
  ListStorePlansQuery,
  UpdateStorePlanDiscountDto,
  UpdateStorePlanDto,
  UpsertStorePlanPricingDto
} from './store-plans.validation';

export class StorePlansService {
  private async assertRootCategory(categoryId: string) {
    const category = await categoriesRepository.findById(categoryId);
    if (!category) throw new ApiError(404, 'Category not found');
    if (category.parentId) {
      throw new ApiError(400, 'Store plan pricing must use a main (root) category');
    }
    return category;
  }

  private getPlanDiscount(plan: {
    discountType: StoreDiscountType;
    discountValue: number | string | { toString(): string };
    isDiscountActive: boolean;
  }) {
    return {
      discountType: plan.discountType,
      discountValue: plan.discountValue,
      isDiscountActive: plan.isDiscountActive
    };
  }

  private mapPlan<
    T extends {
      discountType: StoreDiscountType;
      discountValue: number | string | { toString(): string };
      isDiscountActive: boolean;
      pricing?: PricingRow[] | null;
    }
  >(plan: T) {
    const planDiscount = this.getPlanDiscount(plan);
    return {
      ...plan,
      pricing: (plan.pricing ?? []).map((row) => withComputedPricing(row, planDiscount))
    };
  }

  private extractDefaultPricing(plan: Awaited<ReturnType<typeof this.getById>>) {
    const oneMonth = plan.pricing.find((row) => row.billingPeriod === 'ONE_MONTH');
    const twoMonths = plan.pricing.find((row) => row.billingPeriod === 'TWO_MONTHS');
    const threeMonths = plan.pricing.find((row) => row.billingPeriod === 'THREE_MONTHS');

    return {
      oneMonthPrice: oneMonth ? Number(oneMonth.price) : 0,
      oneMonthMaxListings: oneMonth?.maxListings ?? 10,
      twoMonthsPrice: twoMonths ? Number(twoMonths.price) : 0,
      twoMonthsMaxListings: twoMonths?.maxListings ?? 20,
      threeMonthsPrice: threeMonths ? Number(threeMonths.price) : 0,
      threeMonthsMaxListings: threeMonths?.maxListings ?? 30
    };
  }

  async list(query: ListStorePlansQuery) {
    if (query.categoryId) await this.assertRootCategory(query.categoryId);
    const plans = await storePlansRepository.listPlans(query);
    return plans.map((plan) => this.mapPlan(plan));
  }

  async getById(id: string) {
    const plan = await storePlansRepository.findPlanById(id);
    if (!plan) throw new ApiError(404, 'Store plan not found');
    return this.mapPlan(plan);
  }

  private async validatePlanFields(
    dto: CreateStorePlanDto | UpdateStorePlanDto,
    existing?: { trialDays: number; trialMaxListings: number }
  ) {
    const trialDays = dto.trialDays ?? existing?.trialDays ?? 0;
    const trialMaxListings = dto.trialMaxListings ?? existing?.trialMaxListings ?? 0;

    if (trialDays > 0 && trialMaxListings <= 0) {
      throw new ApiError(400, 'Trial max listings is required when trial days is greater than zero');
    }

    if (dto.promotionPlanId) {
      const promotionPlan = await promotionsRepository.findPlanById(dto.promotionPlanId);
      if (!promotionPlan) {
        throw new ApiError(404, 'Promotion plan not found');
      }
    }
  }

  async create(dto: CreateStorePlanDto) {
    await this.validatePlanFields(dto);
    const {
      oneMonthPrice,
      oneMonthMaxListings,
      twoMonthsPrice,
      twoMonthsMaxListings,
      threeMonthsPrice,
      threeMonthsMaxListings,
      ...planData
    } = dto;
    const plan = await storePlansRepository.createPlan(planData);
    await storePlansRepository.syncPricingForAllRootCategories(plan.id, {
      oneMonthPrice,
      oneMonthMaxListings,
      twoMonthsPrice,
      twoMonthsMaxListings,
      threeMonthsPrice,
      threeMonthsMaxListings
    });
    return this.getById(plan.id);
  }

  async update(id: string, dto: UpdateStorePlanDto) {
    const existing = await this.getById(id);
    await this.validatePlanFields(dto, {
      trialDays: existing.trialDays,
      trialMaxListings: existing.trialMaxListings
    });

    const {
      oneMonthPrice,
      oneMonthMaxListings,
      twoMonthsPrice,
      twoMonthsMaxListings,
      threeMonthsPrice,
      threeMonthsMaxListings,
      ...planData
    } = dto;
    await storePlansRepository.updatePlan(id, planData);

    const shouldSyncPricing =
      oneMonthPrice !== undefined ||
      oneMonthMaxListings !== undefined ||
      twoMonthsPrice !== undefined ||
      twoMonthsMaxListings !== undefined ||
      threeMonthsPrice !== undefined ||
      threeMonthsMaxListings !== undefined;

    if (shouldSyncPricing) {
      const currentDefaults = this.extractDefaultPricing(existing);
      await storePlansRepository.syncPricingForAllRootCategories(id, {
        oneMonthPrice: oneMonthPrice ?? currentDefaults.oneMonthPrice,
        oneMonthMaxListings: oneMonthMaxListings ?? currentDefaults.oneMonthMaxListings,
        twoMonthsPrice: twoMonthsPrice ?? currentDefaults.twoMonthsPrice,
        twoMonthsMaxListings: twoMonthsMaxListings ?? currentDefaults.twoMonthsMaxListings,
        threeMonthsPrice: threeMonthsPrice ?? currentDefaults.threeMonthsPrice,
        threeMonthsMaxListings: threeMonthsMaxListings ?? currentDefaults.threeMonthsMaxListings
      });
    }

    return this.getById(id);
  }

  async remove(id: string) {
    await this.getById(id);
    return storePlansRepository.softDeletePlan(id);
  }

  async upsertPricing(planId: string, dto: UpsertStorePlanPricingDto) {
    const plan = await this.getById(planId);
    await this.assertRootCategory(dto.categoryId);
    const row = await storePlansRepository.upsertPricing(planId, dto);
    return withComputedPricing(row, this.getPlanDiscount(plan));
  }

  async bulkUpsertPricing(planId: string, dto: BulkUpsertStorePlanPricingDto) {
    const plan = await this.getById(planId);
    await this.assertRootCategory(dto.categoryId);
    const result = await storePlansRepository.bulkUpsertPricing(planId, dto);
    const planDiscount = this.getPlanDiscount(plan);
    return {
      oneMonth: withComputedPricing(result.oneMonth, planDiscount),
      twoMonths: withComputedPricing(result.twoMonths, planDiscount),
      threeMonths: withComputedPricing(result.threeMonths, planDiscount)
    };
  }

  async updatePlanDiscount(planId: string, dto: UpdateStorePlanDiscountDto) {
    const plan = await storePlansRepository.findPlanById(planId);
    if (!plan) throw new ApiError(404, 'Store plan not found');

    const nextType = dto.discountType ?? plan.discountType;
    const nextValue = dto.discountValue ?? Number(plan.discountValue);
    const nextActive = dto.isDiscountActive ?? plan.isDiscountActive;

    if (nextActive && nextType === StoreDiscountType.PERCENTAGE && nextValue > 100) {
      throw new ApiError(400, 'Percentage discount cannot exceed 100');
    }

    await storePlansRepository.updatePlanDiscount(planId, {
      ...dto,
      ...(dto.isDiscountActive === false && { discountType: StoreDiscountType.NONE, discountValue: 0 })
    });

    return this.getById(planId);
  }

  async updateDiscount(pricingId: string, dto: UpdateStorePlanDiscountDto) {
    const pricing = await storePlansRepository.findPricingById(pricingId);
    if (!pricing) throw new ApiError(404, 'Store plan pricing not found');

    const planDiscount = pricing.plan ? this.getPlanDiscount(pricing.plan) : undefined;
    const nextType = dto.discountType ?? pricing.discountType;
    const nextValue = dto.discountValue ?? Number(pricing.discountValue);
    const nextActive = dto.isDiscountActive ?? pricing.isDiscountActive;

    if (nextActive && nextType === StoreDiscountType.PERCENTAGE && nextValue > 100) {
      throw new ApiError(400, 'Percentage discount cannot exceed 100');
    }

    const priceAfterPlan = planDiscount
      ? withComputedPricing({ ...pricing, isDiscountActive: false }, planDiscount).finalPrice
      : Number(pricing.price);

    if (nextActive && nextType === StoreDiscountType.FIXED && nextValue > priceAfterPlan) {
      throw new ApiError(400, 'Fixed discount cannot exceed the price after plan discount');
    }

    const updated = await storePlansRepository.updatePricingDiscount(pricingId, {
      ...dto,
      ...(dto.isDiscountActive === false && { discountType: StoreDiscountType.NONE, discountValue: 0 })
    });

    return withComputedPricing(updated, planDiscount);
  }

  async removePricing(pricingId: string) {
    const pricing = await storePlansRepository.findPricingById(pricingId);
    if (!pricing) throw new ApiError(404, 'Store plan pricing not found');
    return storePlansRepository.softDeletePricing(pricingId);
  }
}

export const storePlansService = new StorePlansService();
