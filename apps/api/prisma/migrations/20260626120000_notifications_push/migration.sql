-- CreateEnum
CREATE TYPE "PushPlatform" AS ENUM ('WEB', 'ANDROID', 'IOS');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'PROMOTION_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ACCOUNT_DISABLED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'STORE_SUBSCRIPTION_EXPIRING';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TRUST_BADGE_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'TRUST_BADGE_REJECTED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_BANNER_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_TRUST_BADGE_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'ADMIN_REPORT';

-- AlterTable
ALTER TABLE "AdPromotion" ADD COLUMN IF NOT EXISTS "expiryWarningNotifiedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StoreSubscription" ADD COLUMN IF NOT EXISTS "expiryWarningNotifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE IF NOT EXISTS "PushToken" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" "PushPlatform" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PushToken_userId_idx" ON "PushToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "PushToken_userId_token_key" ON "PushToken"("userId", "token");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PushToken" ADD CONSTRAINT "PushToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
