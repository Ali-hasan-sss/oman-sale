-- CreateEnum
CREATE TYPE "StoreBusinessType" AS ENUM ('COMMERCIAL', 'HOME');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "businessType" "StoreBusinessType" NOT NULL DEFAULT 'COMMERCIAL';
ALTER TABLE "Store" ALTER COLUMN "commercialRegistrationNumber" DROP NOT NULL;
