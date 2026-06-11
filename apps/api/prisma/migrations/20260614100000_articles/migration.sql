-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArticleReactionType" AS ENUM ('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY', 'DISLIKE');

-- CreateTable
CREATE TABLE "ArticleCategory" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArticleCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "bodyAr" TEXT NOT NULL,
    "bodyEn" TEXT NOT NULL,
    "coverImageUrl" TEXT NOT NULL,
    "galleryImages" JSONB NOT NULL DEFAULT '[]',
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "categoryId" TEXT NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleView" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "ipAddress" TEXT,
    "source" "ViewSource" NOT NULL DEFAULT 'WEB',
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleSave" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,

    CONSTRAINT "ArticleSave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleComment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ArticleComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleReaction" (
    "id" TEXT NOT NULL,
    "type" "ArticleReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "articleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "ArticleReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ArticleCategory_slug_key" ON "ArticleCategory"("slug");

-- CreateIndex
CREATE INDEX "ArticleCategory_isActive_sortOrder_idx" ON "ArticleCategory"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_publishedAt_idx" ON "Article"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Article_categoryId_idx" ON "Article"("categoryId");

-- CreateIndex
CREATE INDEX "Article_deletedAt_idx" ON "Article"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleView_articleId_visitorKey_key" ON "ArticleView"("articleId", "visitorKey");

-- CreateIndex
CREATE INDEX "ArticleView_articleId_idx" ON "ArticleView"("articleId");

-- CreateIndex
CREATE INDEX "ArticleView_createdAt_idx" ON "ArticleView"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleSave_userId_articleId_key" ON "ArticleSave"("userId", "articleId");

-- CreateIndex
CREATE INDEX "ArticleSave_articleId_idx" ON "ArticleSave"("articleId");

-- CreateIndex
CREATE INDEX "ArticleSave_deletedAt_idx" ON "ArticleSave"("deletedAt");

-- CreateIndex
CREATE INDEX "ArticleComment_articleId_idx" ON "ArticleComment"("articleId");

-- CreateIndex
CREATE INDEX "ArticleComment_userId_idx" ON "ArticleComment"("userId");

-- CreateIndex
CREATE INDEX "ArticleComment_createdAt_idx" ON "ArticleComment"("createdAt");

-- CreateIndex
CREATE INDEX "ArticleComment_deletedAt_idx" ON "ArticleComment"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleReaction_articleId_userId_key" ON "ArticleReaction"("articleId", "userId");

-- CreateIndex
CREATE INDEX "ArticleReaction_articleId_idx" ON "ArticleReaction"("articleId");

-- CreateIndex
CREATE INDEX "ArticleReaction_userId_idx" ON "ArticleReaction"("userId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ArticleCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleView" ADD CONSTRAINT "ArticleView_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleSave" ADD CONSTRAINT "ArticleSave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleSave" ADD CONSTRAINT "ArticleSave_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleComment" ADD CONSTRAINT "ArticleComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleReaction" ADD CONSTRAINT "ArticleReaction_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleReaction" ADD CONSTRAINT "ArticleReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
