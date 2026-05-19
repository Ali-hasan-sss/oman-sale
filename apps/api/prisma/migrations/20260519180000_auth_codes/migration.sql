-- CreateEnum
CREATE TYPE "AuthCodePurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET');

-- CreateTable
CREATE TABLE "AuthVerificationCode" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "AuthCodePurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "AuthVerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthVerificationCode_email_purpose_idx" ON "AuthVerificationCode"("email", "purpose");

-- CreateIndex
CREATE INDEX "AuthVerificationCode_userId_idx" ON "AuthVerificationCode"("userId");

-- CreateIndex
CREATE INDEX "AuthVerificationCode_expiresAt_idx" ON "AuthVerificationCode"("expiresAt");

-- AddForeignKey
ALTER TABLE "AuthVerificationCode" ADD CONSTRAINT "AuthVerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
