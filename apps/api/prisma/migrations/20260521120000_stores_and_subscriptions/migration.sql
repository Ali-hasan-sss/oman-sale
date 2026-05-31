-- CreateEnum
CREATE TYPE "StoreBillingPeriod" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "StoreDiscountType" AS ENUM ('NONE', 'FIXED', 'PERCENTAGE');

-- CreateEnum
CREATE TYPE "StoreSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Category" ADD COLUMN "storeBaseMonthlyPrice" DECIMAL(12,3);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "storeSubscriptionId" TEXT;

-- CreateTable
CREATE TABLE "StoreSubscriptionPlan" (
    "id" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StoreSubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StorePlanPricing" (
    "id" TEXT NOT NULL,
    "billingPeriod" "StoreBillingPeriod" NOT NULL,
    "price" DECIMAL(12,3) NOT NULL,
    "maxListings" INTEGER NOT NULL,
    "discountType" "StoreDiscountType" NOT NULL DEFAULT 'NONE',
    "discountValue" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "isDiscountActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "planId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "StorePlanPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "bioAr" TEXT NOT NULL DEFAULT '',
    "bioEn" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "phone" TEXT,
    "workingHours" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "rootCategoryId" TEXT NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSubscription" (
    "id" TEXT NOT NULL,
    "billingPeriod" "StoreBillingPeriod" NOT NULL,
    "basePrice" DECIMAL(12,3) NOT NULL,
    "discountAmount" DECIMAL(12,3) NOT NULL DEFAULT 0,
    "finalPrice" DECIMAL(12,3) NOT NULL,
    "maxListings" INTEGER NOT NULL,
    "status" "StoreSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "storeId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "pricingId" TEXT NOT NULL,

    CONSTRAINT "StoreSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_slug_key" ON "Store"("slug");

-- CreateIndex
CREATE INDEX "Store_userId_idx" ON "Store"("userId");

-- CreateIndex
CREATE INDEX "Store_rootCategoryId_idx" ON "Store"("rootCategoryId");

-- CreateIndex
CREATE INDEX "Store_isActive_idx" ON "Store"("isActive");

-- CreateIndex
CREATE INDEX "Store_deletedAt_idx" ON "Store"("deletedAt");

-- CreateIndex
CREATE INDEX "StoreSubscriptionPlan_isActive_idx" ON "StoreSubscriptionPlan"("isActive");

-- CreateIndex
CREATE INDEX "StoreSubscriptionPlan_sortOrder_idx" ON "StoreSubscriptionPlan"("sortOrder");

-- CreateIndex
CREATE INDEX "StoreSubscriptionPlan_deletedAt_idx" ON "StoreSubscriptionPlan"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "StorePlanPricing_planId_categoryId_billingPeriod_key" ON "StorePlanPricing"("planId", "categoryId", "billingPeriod");

-- CreateIndex
CREATE INDEX "StorePlanPricing_categoryId_idx" ON "StorePlanPricing"("categoryId");

-- CreateIndex
CREATE INDEX "StorePlanPricing_planId_idx" ON "StorePlanPricing"("planId");

-- CreateIndex
CREATE INDEX "StorePlanPricing_deletedAt_idx" ON "StorePlanPricing"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_storeSubscriptionId_key" ON "Payment"("storeSubscriptionId");

-- CreateIndex
CREATE INDEX "StoreSubscription_storeId_idx" ON "StoreSubscription"("storeId");

-- CreateIndex
CREATE INDEX "StoreSubscription_planId_idx" ON "StoreSubscription"("planId");

-- CreateIndex
CREATE INDEX "StoreSubscription_pricingId_idx" ON "StoreSubscription"("pricingId");

-- CreateIndex
CREATE INDEX "StoreSubscription_status_idx" ON "StoreSubscription"("status");

-- CreateIndex
CREATE INDEX "StoreSubscription_isActive_idx" ON "StoreSubscription"("isActive");

-- CreateIndex
CREATE INDEX "StoreSubscription_endsAt_idx" ON "StoreSubscription"("endsAt");

-- CreateIndex
CREATE INDEX "StoreSubscription_deletedAt_idx" ON "StoreSubscription"("deletedAt");

-- AddForeignKey
ALTER TABLE "StorePlanPricing" ADD CONSTRAINT "StorePlanPricing_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StoreSubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StorePlanPricing" ADD CONSTRAINT "StorePlanPricing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_rootCategoryId_fkey" FOREIGN KEY ("rootCategoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSubscription" ADD CONSTRAINT "StoreSubscription_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSubscription" ADD CONSTRAINT "StoreSubscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "StoreSubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StoreSubscription" ADD CONSTRAINT "StoreSubscription_pricingId_fkey" FOREIGN KEY ("pricingId") REFERENCES "StorePlanPricing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_storeSubscriptionId_fkey" FOREIGN KEY ("storeSubscriptionId") REFERENCES "StoreSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
