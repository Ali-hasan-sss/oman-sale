-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STORE_TRIAL_EXPIRED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STORE_SUBSCRIPTION_EXPIRED';

-- AlterTable
ALTER TABLE "Ad" ADD COLUMN IF NOT EXISTS "storeId" TEXT;

-- AlterTable
ALTER TABLE "StoreSubscription" ADD COLUMN IF NOT EXISTS "expiredNotifiedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Ad_storeId_idx" ON "Ad"("storeId");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Ad_storeId_fkey'
  ) THEN
    ALTER TABLE "Ad" ADD CONSTRAINT "Ad_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
