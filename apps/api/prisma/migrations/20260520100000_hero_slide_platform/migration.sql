-- CreateEnum
CREATE TYPE "HeroSlidePlatform" AS ENUM ('WEB', 'MOBILE');

-- AlterTable
ALTER TABLE "HeroSlide" ADD COLUMN "platform" "HeroSlidePlatform" NOT NULL DEFAULT 'WEB';

-- DropIndex
DROP INDEX "HeroSlide_isActive_sortOrder_idx";

-- CreateIndex
CREATE INDEX "HeroSlide_isActive_platform_sortOrder_idx" ON "HeroSlide"("isActive", "platform", "sortOrder");
