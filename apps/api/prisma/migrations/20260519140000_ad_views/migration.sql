-- CreateEnum
CREATE TYPE "ViewSource" AS ENUM ('WEB', 'MOBILE');

-- CreateTable
CREATE TABLE "AdView" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "ipAddress" TEXT,
    "source" "ViewSource" NOT NULL DEFAULT 'WEB',
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdView_adId_visitorKey_key" ON "AdView"("adId", "visitorKey");
CREATE INDEX "AdView_adId_idx" ON "AdView"("adId");
CREATE INDEX "AdView_ipAddress_idx" ON "AdView"("ipAddress");
CREATE INDEX "AdView_createdAt_idx" ON "AdView"("createdAt");

-- AddForeignKey
ALTER TABLE "AdView" ADD CONSTRAINT "AdView_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;
