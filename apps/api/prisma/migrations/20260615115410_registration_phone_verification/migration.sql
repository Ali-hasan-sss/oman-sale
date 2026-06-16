-- AlterEnum
ALTER TYPE "AuthCodePurpose" ADD VALUE 'PHONE_VERIFICATION';

-- AlterTable
ALTER TABLE "AuthVerificationCode" ADD COLUMN     "phone" TEXT;

-- CreateIndex
CREATE INDEX "AuthVerificationCode_phone_purpose_idx" ON "AuthVerificationCode"("phone", "purpose");
