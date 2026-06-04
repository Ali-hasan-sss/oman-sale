-- CreateTable
CREATE TABLE "StoreType" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StoreType_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Store" ADD COLUMN "storeTypeId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "StoreType_slug_key" ON "StoreType"("slug");

-- CreateIndex
CREATE INDEX "StoreType_isActive_sortOrder_idx" ON "StoreType"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "StoreType_deletedAt_idx" ON "StoreType"("deletedAt");

-- CreateIndex
CREATE INDEX "Store_storeTypeId_idx" ON "Store"("storeTypeId");

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_storeTypeId_fkey" FOREIGN KEY ("storeTypeId") REFERENCES "StoreType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
