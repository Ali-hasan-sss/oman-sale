-- AlterTable
ALTER TABLE "Store" ADD COLUMN "nationalId" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Store" ADD COLUMN "commercialRegistrationNumber" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Store" ALTER COLUMN "isActive" SET DEFAULT false;
