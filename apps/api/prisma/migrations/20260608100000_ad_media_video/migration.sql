-- CreateEnum
CREATE TYPE "AdMediaType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "AdImage" ADD COLUMN "mediaType" "AdMediaType" NOT NULL DEFAULT 'IMAGE';
