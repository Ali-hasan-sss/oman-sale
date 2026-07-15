ALTER TABLE "Ad" ADD COLUMN "modelYear" INTEGER;

CREATE INDEX "Ad_modelYear_idx" ON "Ad"("modelYear");
