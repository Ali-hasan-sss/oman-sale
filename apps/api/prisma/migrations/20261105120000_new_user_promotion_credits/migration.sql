ALTER TABLE "PromotionPlan"
ADD COLUMN "freeAdsForNewUsers" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "freeAdDurationDays" INTEGER NOT NULL DEFAULT 7;

CREATE TABLE "UserPromotionCredit" (
    "id" TEXT NOT NULL,
    "remaining" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,

    CONSTRAINT "UserPromotionCredit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserPromotionCredit_userId_planId_key" ON "UserPromotionCredit"("userId", "planId");
CREATE INDEX "UserPromotionCredit_userId_idx" ON "UserPromotionCredit"("userId");

ALTER TABLE "UserPromotionCredit"
ADD CONSTRAINT "UserPromotionCredit_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "UserPromotionCredit"
ADD CONSTRAINT "UserPromotionCredit_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "PromotionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
