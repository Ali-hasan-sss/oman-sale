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
      promotionPlanId?: string | null;
      promotionPlan?: ({ deletedAt?: Date | null } & Record<string, unknown>) | null;
      pricing?: PricingRow[] | null;
    }
  >(plan: T) {
    const planDiscount = this.getPlanDiscount(plan);
    const rawPromotion = plan.promotionPlan;
    const promotionAlive = rawPromotion && !rawPromotion.deletedAt ? rawPromotion : null;
    const promotionPlan = promotionAlive
      ? (() => {
          const { deletedAt: _deletedAt, ...rest } = promotionAlive;
          return rest;
        })()
      : null;

    return {
      ...plan,
      promotionPlanId: promotionPlan ? plan.promotionPlanId : null,
      promotionPlan,
      pricing: (plan.pricing ?? []).map((row) => withComputedPricing(row, planDiscount))
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
  ): Promise<{ promotionPlanId?: string | null }> {
    const trialDays = dto.trialDays ?? existing?.trialDays ?? 0;
    const trialMaxListings = dto.trialMaxListings ?? existing?.trialMaxListings ?? 0;

    if (trialDays > 0 && trialMaxListings <= 0) {
      throw new ApiError(400, 'Trial max listings is required when trial days is greater than zero');
    }

    if (dto.promotionPlanId === undefined) {
      return {};
    }

    if (dto.promotionPlanId === null) {
      return { promotionPlanId: null };
    }

    const promotionPlan = await promotionsRepository.findPlanById(dto.promotionPlanId);
    if (!promotionPlan) {
      // Stale FK (e.g. soft-deleted promotion) must not block store plan updates.
      return { promotionPlanId: null };
    }

    return { promotionPlanId: dto.promotionPlanId };
  }

  async create(dto: CreateStorePlanDto) {
    const promotionFix = await this.validatePlanFields(dto);
    const {
      oneMonthPrice,
      oneMonthMaxListings,
      twoMonthsPrice,
      twoMonthsMaxListings,
      threeMonthsPrice,
      threeMonthsMaxListings,
      ...planData
    } = dto;
    const plan = await storePlansRepository.createPlan({ ...planData, ...promotionFix });
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
    const promotionFix = await this.validatePlanFields(dto, {
      trialDays: existing.trialDays,
      trialMaxListings: existing.trialMaxListings
    });

    const {
      oneMonthPrice: _oneMonthPrice,
      oneMonthMaxListings: _oneMonthMaxListings,
      twoMonthsPrice: _twoMonthsPrice,
      twoMonthsMaxListings: _twoMonthsMaxListings,
      threeMonthsPrice: _threeMonthsPrice,
      threeMonthsMaxListings: _threeMonthsMaxListings,
      ...planData
    } = dto;

    // Plan metadata only — never overwrite per-category pricing on update.
    // Category prices are managed via /store-plans/:id/pricing endpoints.
    await storePlansRepository.updatePlan(id, { ...planData, ...promotionFix });

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
