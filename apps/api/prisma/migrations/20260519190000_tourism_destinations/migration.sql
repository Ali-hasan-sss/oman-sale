-- CreateTable
CREATE TABLE "TourismDestination" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "imageUrl" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "rating" TEXT NOT NULL DEFAULT '4.9',
    "ratingLabelAr" TEXT NOT NULL,
    "ratingLabelEn" TEXT NOT NULL,
    "aboutAr" TEXT NOT NULL,
    "aboutEn" TEXT NOT NULL,
    "highlightsAr" JSONB NOT NULL,
    "highlightsEn" JSONB NOT NULL,
    "activitiesAr" JSONB NOT NULL,
    "activitiesEn" JSONB NOT NULL,
    "bestTimeAr" TEXT NOT NULL,
    "bestTimeEn" TEXT NOT NULL,
    "addressAr" TEXT NOT NULL,
    "addressEn" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TourismDestination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TourismDestination_slug_key" ON "TourismDestination"("slug");

-- CreateIndex
CREATE INDEX "TourismDestination_isActive_sortOrder_idx" ON "TourismDestination"("isActive", "sortOrder");
