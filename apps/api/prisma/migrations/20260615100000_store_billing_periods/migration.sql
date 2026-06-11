CREATE TYPE "StoreBillingPeriod_new" AS ENUM ('ONE_MONTH', 'TWO_MONTHS', 'THREE_MONTHS');

ALTER TABLE "StorePlanPricing"
  ALTER COLUMN "billingPeriod" TYPE "StoreBillingPeriod_new"
  USING (
    CASE "billingPeriod"::text
      WHEN 'MONTHLY' THEN 'ONE_MONTH'::"StoreBillingPeriod_new"
      WHEN 'YEARLY' THEN 'THREE_MONTHS'::"StoreBillingPeriod_new"
      ELSE 'ONE_MONTH'::"StoreBillingPeriod_new"
    END
  );

ALTER TABLE "StoreSubscription"
  ALTER COLUMN "billingPeriod" TYPE "StoreBillingPeriod_new"
  USING (
    CASE "billingPeriod"::text
      WHEN 'MONTHLY' THEN 'ONE_MONTH'::"StoreBillingPeriod_new"
      WHEN 'YEARLY' THEN 'THREE_MONTHS'::"StoreBillingPeriod_new"
      ELSE 'ONE_MONTH'::"StoreBillingPeriod_new"
    END
  );

DROP TYPE "StoreBillingPeriod";
ALTER TYPE "StoreBillingPeriod_new" RENAME TO "StoreBillingPeriod";

INSERT INTO "StorePlanPricing" (
  "id",
  "billingPeriod",
  "price",
  "maxListings",
  "discountType",
  "discountValue",
  "isDiscountActive",
  "createdAt",
  "updatedAt",
  "planId",
  "categoryId"
)
SELECT
  gen_random_uuid(),
  'TWO_MONTHS'::"StoreBillingPeriod",
  p."price",
  p."maxListings",
  p."discountType",
  p."discountValue",
  p."isDiscountActive",
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  p."planId",
  p."categoryId"
FROM "StorePlanPricing" p
WHERE p."billingPeriod" = 'ONE_MONTH'
  AND p."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "StorePlanPricing" existing
    WHERE existing."planId" = p."planId"
      AND existing."categoryId" = p."categoryId"
      AND existing."billingPeriod" = 'TWO_MONTHS'
      AND existing."deletedAt" IS NULL
  );

UPDATE "StoreSubscription"
SET "endsAt" = "startsAt" + (
  CASE "billingPeriod"::text
    WHEN 'ONE_MONTH' THEN INTERVAL '30 days'
    WHEN 'TWO_MONTHS' THEN INTERVAL '60 days'
    WHEN 'THREE_MONTHS' THEN INTERVAL '90 days'
    ELSE INTERVAL '30 days'
  END
)
WHERE "deletedAt" IS NULL
  AND "isTrial" = false
  AND "status" = 'ACTIVE'
  AND "startsAt" IS NOT NULL;
