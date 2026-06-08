-- CreateTable
CREATE TABLE "HeroSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "wantedCategoryId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeroSettings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "HeroSettings" ADD CONSTRAINT "HeroSettings_wantedCategoryId_fkey" FOREIGN KEY ("wantedCategoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert default row
INSERT INTO "HeroSettings" ("id", "updatedAt") VALUES ('default', CURRENT_TIMESTAMP);
