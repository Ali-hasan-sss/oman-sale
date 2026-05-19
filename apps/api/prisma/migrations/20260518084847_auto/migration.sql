-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "nameAr" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "nameEn" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "Category_type_isActive_idx" ON "Category"("type", "isActive");
