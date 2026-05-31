-- AlterTable
ALTER TABLE "StoreSubscriptionPlan" ADD COLUMN "discountType" "StoreDiscountType" NOT NULL DEFAULT 'NONE';
ALTER TABLE "StoreSubscriptionPlan" ADD COLUMN "discountValue" DECIMAL(12,3) NOT NULL DEFAULT 0;
ALTER TABLE "StoreSubscriptionPlan" ADD COLUMN "isDiscountActive" BOOLEAN NOT NULL DEFAULT false;
