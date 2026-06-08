-- CreateTable
CREATE TABLE "HeaderNavButton" (
    "id" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "labelAr" TEXT NOT NULL,
    "labelEn" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeaderNavButton_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HeaderNavButton_isActive_sortOrder_idx" ON "HeaderNavButton"("isActive", "sortOrder");

-- Migrate existing "wanted for purchase" setting into a header button
INSERT INTO "HeaderNavButton" ("id", "sortOrder", "labelAr", "labelEn", "linkUrl", "isActive", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    0,
    'مطلوب للشراء',
    'Wanted to buy',
    '/category/' || c."slug",
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "HeroSettings" hs
INNER JOIN "Category" c ON c."id" = hs."wantedCategoryId"
WHERE hs."wantedCategoryId" IS NOT NULL;

-- DropTable
ALTER TABLE "HeroSettings" DROP CONSTRAINT IF EXISTS "HeroSettings_wantedCategoryId_fkey";
DROP TABLE IF EXISTS "HeroSettings";
