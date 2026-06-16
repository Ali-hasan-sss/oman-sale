-- CreateEnum
CREATE TYPE "TrustBadgeStatus" AS ENUM ('NONE', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TrustIdentityDocumentType" AS ENUM ('NATIONAL_ID', 'PASSPORT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "trustBadgeStatus" "TrustBadgeStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "User" ADD COLUMN "trustIdentityDocType" "TrustIdentityDocumentType";
ALTER TABLE "User" ADD COLUMN "trustIdentityDocUrl" TEXT;
ALTER TABLE "User" ADD COLUMN "trustBadgeReviewedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "trustBadgeRejectionReason" TEXT;

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "trustBadgeStatus" "TrustBadgeStatus" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Store" ADD COLUMN "trustCommercialRegDocUrl" TEXT;
ALTER TABLE "Store" ADD COLUMN "trustOcciDocUrl" TEXT;
ALTER TABLE "Store" ADD COLUMN "trustSmeDocUrl" TEXT;
ALTER TABLE "Store" ADD COLUMN "trustOtherDocUrl" TEXT;
ALTER TABLE "Store" ADD COLUMN "trustOtherDocLabel" TEXT;
ALTER TABLE "Store" ADD COLUMN "trustBadgeReviewedAt" TIMESTAMP(3);
ALTER TABLE "Store" ADD COLUMN "trustBadgeRejectionReason" TEXT;

-- CreateIndex
CREATE INDEX "User_trustBadgeStatus_idx" ON "User"("trustBadgeStatus");

-- CreateIndex
CREATE INDEX "Store_trustBadgeStatus_idx" ON "Store"("trustBadgeStatus");
