-- AlterTable
ALTER TABLE "StoreSubscriptionPlan" ADD COLUMN "trialDays" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StoreSubscription" ADD COLUMN "isTrial" BOOLEAN NOT NULL DEFAULT false;
