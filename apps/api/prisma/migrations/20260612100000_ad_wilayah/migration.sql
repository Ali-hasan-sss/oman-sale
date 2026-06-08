-- AlterTable
ALTER TABLE "Ad" ADD COLUMN "wilayah" TEXT;

-- CreateIndex
CREATE INDEX "Ad_wilayah_idx" ON "Ad"("wilayah");

-- Normalize legacy city values into governorate + wilayah
UPDATE "Ad" SET "city" = 'مسقط', "wilayah" = 'السيب' WHERE "city" = 'السيب';
UPDATE "Ad" SET "city" = 'مسقط', "wilayah" = 'مسقط' WHERE "city" IN ('الخوير', 'القرم');
UPDATE "Ad" SET "city" = 'ظفار', "wilayah" = 'صلالة' WHERE "city" = 'صلالة';
UPDATE "Ad" SET "city" = 'شمال الباطنة', "wilayah" = 'صحار' WHERE "city" = 'صحار';
UPDATE "Ad" SET "city" = 'الداخلية', "wilayah" = 'نزوى' WHERE "city" = 'نزوى';
UPDATE "Ad" SET "city" = 'جنوب الشرقية', "wilayah" = 'صور' WHERE "city" = 'صور';
UPDATE "Ad" SET "city" = 'البريمي', "wilayah" = 'البريمي' WHERE "city" = 'البريمي';
UPDATE "Ad" SET "city" = 'جنوب الباطنة', "wilayah" = 'الرستاق' WHERE "city" = 'الرستاق';
UPDATE "Ad" SET "wilayah" = 'مسقط' WHERE "city" = 'مسقط' AND "wilayah" IS NULL;
