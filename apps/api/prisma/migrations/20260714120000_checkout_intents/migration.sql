-- CreateEnum
CREATE TYPE "CheckoutIntentKind" AS ENUM ('LISTING_PROMOTION', 'STORE_CREATE', 'BANNER_REQUEST');

-- CreateEnum
CREATE TYPE "CheckoutIntentStatus" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "CheckoutIntent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "CheckoutIntentKind" NOT NULL,
    "payload" JSONB NOT NULL,
    "amount" DECIMAL(12,3) NOT NULL,
    "status" "CheckoutIntentStatus" NOT NULL DEFAULT 'PENDING',
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CheckoutIntent_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN "checkoutIntentId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_checkoutIntentId_key" ON "Payment"("checkoutIntentId");

-- CreateIndex
CREATE INDEX "Payment_checkoutIntentId_idx" ON "Payment"("checkoutIntentId");

-- CreateIndex
CREATE INDEX "CheckoutIntent_userId_status_idx" ON "CheckoutIntent"("userId", "status");

-- CreateIndex
CREATE INDEX "CheckoutIntent_status_createdAt_idx" ON "CheckoutIntent"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "CheckoutIntent" ADD CONSTRAINT "CheckoutIntent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_checkoutIntentId_fkey" FOREIGN KEY ("checkoutIntentId") REFERENCES "CheckoutIntent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
