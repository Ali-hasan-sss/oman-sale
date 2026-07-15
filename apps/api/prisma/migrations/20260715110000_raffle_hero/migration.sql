-- AlterTable
ALTER TABLE "Raffle" ADD COLUMN "heroImageUrl" TEXT;

-- AlterTable
ALTER TABLE "HeroSlide" ADD COLUMN "raffleId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "HeroSlide_raffleId_key" ON "HeroSlide"("raffleId");

-- AddForeignKey
ALTER TABLE "HeroSlide" ADD CONSTRAINT "HeroSlide_raffleId_fkey" FOREIGN KEY ("raffleId") REFERENCES "Raffle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
