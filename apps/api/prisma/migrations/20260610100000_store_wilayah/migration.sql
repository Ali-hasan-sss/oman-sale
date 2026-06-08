-- AlterTable
ALTER TABLE "Store" ADD COLUMN "wilayah" TEXT;

-- CreateIndex
CREATE INDEX "Store_wilayah_idx" ON "Store"("wilayah");

-- Normalize legacy city values into governorate + wilayah
UPDATE "Store" SET "city" = 'مسقط', "wilayah" = 'السيب' WHERE "city" = 'السيب';
UPDATE "Store" SET "city" = 'مسقط', "wilayah" = 'مسقط' WHERE "city" IN ('الخوير', 'القرم');
UPDATE "Store" SET "city" = 'ظفار', "wilayah" = 'صلالة' WHERE "city" = 'صلالة';
UPDATE "Store" SET "city" = 'شمال الباطنة', "wilayah" = 'صحار' WHERE "city" = 'صحار';
UPDATE "Store" SET "city" = 'الداخلية', "wilayah" = 'نزوى' WHERE "city" = 'نزوى';
UPDATE "Store" SET "city" = 'جنوب الشرقية', "wilayah" = 'صور' WHERE "city" = 'صور';
UPDATE "Store" SET "city" = 'البريمي', "wilayah" = 'البريمي' WHERE "city" = 'البريمي';
UPDATE "Store" SET "city" = 'جنوب الباطنة', "wilayah" = 'الرستاق' WHERE "city" = 'الرستاق';
UPDATE "Store" SET "wilayah" = 'مسقط' WHERE "city" = 'مسقط' AND "wilayah" IS NULL;
