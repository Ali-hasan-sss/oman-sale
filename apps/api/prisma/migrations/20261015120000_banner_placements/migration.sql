-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM (
  'HOME_BELOW_HERO',
  'HOME_BELOW_CATEGORIES',
  'HOME_BELOW_ARTICLES',
  'CATEGORIES',
  'OFFERS',
  'ARTICLES',
  'ARTICLE',
  'TOURISM',
  'DESTINATION',
  'STORES',
  'STORE',
  'SEARCH',
  'LISTING',
  'RAFFLE',
  'PRICING'
);

-- AlterTable
ALTER TABLE "HeroBanner" ADD COLUMN "placement" "BannerPlacement" NOT NULL DEFAULT 'HOME_BELOW_HERO';
ALTER TABLE "BannerRequest" ADD COLUMN "placement" "BannerPlacement" NOT NULL DEFAULT 'HOME_BELOW_HERO';
ALTER TABLE "BannerPricing" ADD COLUMN "placement" "BannerPlacement";

UPDATE "BannerPricing" SET "placement" = 'HOME_BELOW_HERO' WHERE "placement" IS NULL;

DELETE FROM "BannerPricing" AS older
USING "BannerPricing" AS newer
WHERE older."placement" = newer."placement"
  AND (
    older."updatedAt" < newer."updatedAt"
    OR (older."updatedAt" = newer."updatedAt" AND older."id" > newer."id")
  );

ALTER TABLE "BannerPricing" ALTER COLUMN "placement" SET NOT NULL;
ALTER TABLE "BannerPricing" ALTER COLUMN "placement" SET DEFAULT 'HOME_BELOW_HERO';

-- CreateIndex
CREATE UNIQUE INDEX "BannerPricing_placement_key" ON "BannerPricing"("placement");
CREATE INDEX "HeroBanner_placement_isActive_sortOrder_idx" ON "HeroBanner"("placement", "isActive", "sortOrder");
CREATE INDEX "BannerRequest_placement_status_idx" ON "BannerRequest"("placement", "status");

-- Seed a pricing row for every placement, copying the existing hero-banner price when present.
INSERT INTO "BannerPricing" ("id", "placement", "pricePerDay", "minDays", "maxDays", "isActive", "updatedAt")
SELECT
  gen_random_uuid()::text,
  placement.value::"BannerPlacement",
  COALESCE(src."pricePerDay", 2.000),
  COALESCE(src."minDays", 1),
  COALESCE(src."maxDays", 90),
  COALESCE(src."isActive", true),
  CURRENT_TIMESTAMP
FROM (
  VALUES
    ('HOME_BELOW_HERO'),
    ('HOME_BELOW_CATEGORIES'),
    ('HOME_BELOW_ARTICLES'),
    ('CATEGORIES'),
    ('OFFERS'),
    ('ARTICLES'),
    ('ARTICLE'),
    ('TOURISM'),
    ('DESTINATION'),
    ('STORES'),
    ('STORE'),
    ('SEARCH'),
    ('LISTING'),
    ('RAFFLE'),
    ('PRICING')
) AS placement(value)
LEFT JOIN "BannerPricing" AS src ON src."placement" = 'HOME_BELOW_HERO'
WHERE NOT EXISTS (
  SELECT 1
  FROM "BannerPricing" AS existing
  WHERE existing."placement" = placement.value::"BannerPlacement"
);
