-- AlterTable
ALTER TABLE "StoreSubscriptionPlan" ADD COLUMN IF NOT EXISTS "trialMaxListings" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreSubscriptionPlan" ADD COLUMN IF NOT EXISTS "promotionPlanId" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'StoreSubscriptionPlan_promotionPlanId_fkey'
  ) THEN
    ALTER TABLE "StoreSubscriptionPlan"
      ADD CONSTRAINT "StoreSubscriptionPlan_promotionPlanId_fkey"
      FOREIGN KEY ("promotionPlanId") REFERENCES "PromotionPlan"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "StoreSubscriptionPlan_promotionPlanId_idx" ON "StoreSubscriptionPlan"("promotionPlanId");
