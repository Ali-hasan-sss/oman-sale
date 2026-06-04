-- CreateEnum
CREATE TYPE "BannerRequestStatus" AS ENUM ('PENDING_PAYMENT', 'PENDING_APPROVAL', 'REJECTED', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterTable
ALTER TABLE "HeroBanner" ADD COLUMN "startsAt" TIMESTAMP(3),
ADD COLUMN "endsAt" TIMESTAMP(3),
ADD COLUMN "bannerRequestId" TEXT;

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "bannerRequestId" TEXT;

-- CreateTable
CREATE TABLE "BannerPricing" (
    "id" TEXT NOT NULL,
    "pricePerDay" DECIMAL(12,3) NOT NULL,
    "minDays" INTEGER NOT NULL DEFAULT 1,
    "maxDays" INTEGER NOT NULL DEFAULT 90,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BannerPricing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BannerRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "textAr" TEXT,
    "textEn" TEXT,
    "durationDays" INTEGER NOT NULL,
    "totalPrice" DECIMAL(12,3) NOT NULL,
    "status" "BannerRequestStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "rejectionReason" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BannerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeroBanner_bannerRequestId_key" ON "HeroBanner"("bannerRequestId");

-- CreateIndex
CREATE INDEX "HeroBanner_startsAt_endsAt_idx" ON "HeroBanner"("startsAt", "endsAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bannerRequestId_key" ON "Payment"("bannerRequestId");

-- CreateIndex
CREATE INDEX "BannerRequest_userId_idx" ON "BannerRequest"("userId");

-- CreateIndex
CREATE INDEX "BannerRequest_status_idx" ON "BannerRequest"("status");

-- CreateIndex
CREATE INDEX "BannerRequest_createdAt_idx" ON "BannerRequest"("createdAt");

-- AddForeignKey
ALTER TABLE "HeroBanner" ADD CONSTRAINT "HeroBanner_bannerRequestId_fkey" FOREIGN KEY ("bannerRequestId") REFERENCES "BannerRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bannerRequestId_fkey" FOREIGN KEY ("bannerRequestId") REFERENCES "BannerRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BannerRequest" ADD CONSTRAINT "BannerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default pricing
INSERT INTO "BannerPricing" ("id", "pricePerDay", "minDays", "maxDays", "isActive", "updatedAt")
VALUES ('default-banner-pricing', 2.000, 1, 90, true, CURRENT_TIMESTAMP);
