-- CreateEnum
CREATE TYPE "RaffleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED');

-- CreateTable
CREATE TABLE "Raffle" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "RaffleStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Raffle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RafflePlanPoints" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "raffleId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,

    CONSTRAINT "RafflePlanPoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RaffleEntry" (
    "id" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "raffleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RaffleEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RafflePointTransaction" (
    "id" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raffleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "promotionId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,

    CONSTRAINT "RafflePointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Raffle_status_idx" ON "Raffle"("status");

-- CreateIndex
CREATE INDEX "Raffle_startsAt_endsAt_idx" ON "Raffle"("startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Raffle_deletedAt_idx" ON "Raffle"("deletedAt");

-- CreateIndex
CREATE INDEX "RafflePlanPoints_raffleId_idx" ON "RafflePlanPoints"("raffleId");

-- CreateIndex
CREATE UNIQUE INDEX "RafflePlanPoints_raffleId_planId_key" ON "RafflePlanPoints"("raffleId", "planId");

-- CreateIndex
CREATE INDEX "RaffleEntry_raffleId_totalPoints_idx" ON "RaffleEntry"("raffleId", "totalPoints" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "RaffleEntry_raffleId_userId_key" ON "RaffleEntry"("raffleId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "RafflePointTransaction_promotionId_key" ON "RafflePointTransaction"("promotionId");

-- CreateIndex
CREATE INDEX "RafflePointTransaction_raffleId_idx" ON "RafflePointTransaction"("raffleId");

-- CreateIndex
CREATE INDEX "RafflePointTransaction_userId_idx" ON "RafflePointTransaction"("userId");

-- AddForeignKey
ALTER TABLE "RafflePlanPoints" ADD CONSTRAINT "RafflePlanPoints_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePlanPoints" ADD CONSTRAINT "RafflePlanPoints_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PromotionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RaffleEntry" ADD CONSTRAINT "RaffleEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePointTransaction" ADD CONSTRAINT "RafflePointTransaction_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePointTransaction" ADD CONSTRAINT "RafflePointTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePointTransaction" ADD CONSTRAINT "RafflePointTransaction_promotionId_fkey" FOREIGN KEY ("promotionId") REFERENCES "AdPromotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RafflePointTransaction" ADD CONSTRAINT "RafflePointTransaction_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PromotionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
