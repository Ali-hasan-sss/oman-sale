-- AlterTable
ALTER TABLE "Ad" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
ALTER TABLE "Ad" ALTER COLUMN "isApproved" SET DEFAULT true;
ALTER TABLE "Ad" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Ad" ADD COLUMN "isSold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ad" ADD COLUMN "soldAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Ad_isActive_idx" ON "Ad"("isActive");
CREATE INDEX "Ad_isSold_idx" ON "Ad"("isSold");

-- Existing pending ads become active listings
UPDATE "Ad" SET "status" = 'ACTIVE', "isApproved" = true, "isActive" = true WHERE "status" = 'PENDING' AND "deletedAt" IS NULL;
