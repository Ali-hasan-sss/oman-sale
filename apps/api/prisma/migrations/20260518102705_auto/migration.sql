-- CreateTable
CREATE TABLE "AdPromotionDailyImpression" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "promotionId" TEXT NOT NULL,

    CONSTRAINT "AdPromotionDailyImpression_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AdPromotionDailyImpression_date_idx" ON "AdPromotionDailyImpression"("date");

-- CreateIndex
CREATE UNIQUE INDEX "AdPromotionDailyImpression_promotionId_date_key" ON "AdPromotionDailyImpression"("promotionId", "date");

-- AddForeignKey
ALTER TABLE "AdPromotionDailyImpression" ADD CONSTRAINT "AdPromotionDailyImpression_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "AdPromotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
