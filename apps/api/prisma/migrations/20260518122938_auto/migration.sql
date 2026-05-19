-- CreateTable
CREATE TABLE "CategoryFilter" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "CategoryFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryFilterOption" (
    "id" TEXT NOT NULL,
    "labelAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "filterId" TEXT NOT NULL,

    CONSTRAINT "CategoryFilterOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdFilterValue" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "adId" TEXT NOT NULL,
    "filterId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,

    CONSTRAINT "AdFilterValue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CategoryFilter_categoryId_idx" ON "CategoryFilter"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryFilter_isActive_idx" ON "CategoryFilter"("isActive");

-- CreateIndex
CREATE INDEX "CategoryFilter_deletedAt_idx" ON "CategoryFilter"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryFilter_categoryId_slug_key" ON "CategoryFilter"("categoryId", "slug");

-- CreateIndex
CREATE INDEX "CategoryFilterOption_filterId_idx" ON "CategoryFilterOption"("filterId");

-- CreateIndex
CREATE INDEX "CategoryFilterOption_isActive_idx" ON "CategoryFilterOption"("isActive");

-- CreateIndex
CREATE INDEX "CategoryFilterOption_deletedAt_idx" ON "CategoryFilterOption"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryFilterOption_filterId_slug_key" ON "CategoryFilterOption"("filterId", "slug");

-- CreateIndex
CREATE INDEX "AdFilterValue_adId_idx" ON "AdFilterValue"("adId");

-- CreateIndex
CREATE INDEX "AdFilterValue_filterId_idx" ON "AdFilterValue"("filterId");

-- CreateIndex
CREATE INDEX "AdFilterValue_optionId_idx" ON "AdFilterValue"("optionId");

-- CreateIndex
CREATE INDEX "AdFilterValue_deletedAt_idx" ON "AdFilterValue"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdFilterValue_adId_filterId_key" ON "AdFilterValue"("adId", "filterId");

-- AddForeignKey
ALTER TABLE "CategoryFilter" ADD CONSTRAINT "CategoryFilter_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryFilterOption" ADD CONSTRAINT "CategoryFilterOption_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "CategoryFilter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdFilterValue" ADD CONSTRAINT "AdFilterValue_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdFilterValue" ADD CONSTRAINT "AdFilterValue_filterId_fkey" FOREIGN KEY ("filterId") REFERENCES "CategoryFilter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdFilterValue" ADD CONSTRAINT "AdFilterValue_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "CategoryFilterOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
