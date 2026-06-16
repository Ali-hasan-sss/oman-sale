'use client';

import DOMPurify from 'isomorphic-dompurify';
import { Calendar, Eye, Expand, Share2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { ArticleComments } from '@/components/articles/article-comments';
import { ArticleDetailSkeleton } from '@/components/articles/article-skeleton';
import { ArticleReactions } from '@/components/articles/article-reactions';
import { ArticleSaveButton } from '@/components/articles/article-save-button';
import { SiteFooter } from '@/components/home/site-footer';
import { ListingImageGalleryModal } from '@/components/listings/listing-image-gallery-modal';
import { UserSiteHeader } from '@/components/navigation/user-site-header';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { resolveMediaUrl } from '@/lib/media-url';
import { getUserAccessToken } from '@/lib/user-auth';

type ArticleDetails = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
  bodyAr: string;
  bodyEn: string;
  coverImageUrl: string;
  galleryImages: string[];
  views: number;
  publishedAt?: string | null;
  category?: { nameAr: string; nameEn: string };
};

type ArticleDetailsPageProps = {
  slug: string;
};

export function ArticleDetailsPage({ slug }: ArticleDetailsPageProps) {
  const { dir, locale, m } = useI18n();
  const [article, setArticle] = useState<ArticleDetails | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const token = getUserAccessToken();
    const requests = [
      api.get<{ data: ArticleDetails }>(`/articles/${slug}`),
      token
        ? api.get<{ data: string[] }>('/articles/saves/ids', { headers: { Authorization: `Bearer ${token}` } })
        : Promise.resolve({ data: { data: [] as string[] } })
    ] as const;

    Promise.all(requests)
      .then(([articleRes, savesRes]) => {
        if (cancelled) return;
        setArticle(articleRes.data.data);
        setSavedIds(savesRes.data.data);
        setActiveIndex(0);
      })
      .catch(() => {
        if (!cancelled) setArticle(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const title = article ? (locale === 'en' ? article.titleEn : article.titleAr) : '';
  const body = article ? (locale === 'en' ? article.bodyEn : article.bodyAr) : '';
  const categoryName = article ? (locale === 'en' ? article.category?.nameEn : article.category?.nameAr) : '';
  const sanitizedBody = useMemo(() => DOMPurify.sanitize(body), [body]);

  const imageKeys = useMemo(() => {
    if (!article) return [];
    return [...new Set([article.coverImageUrl, ...(article.galleryImages ?? [])].filter(Boolean))];
  }, [article]);

  const resolvedImages = useMemo(() => imageKeys.map(resolveMediaUrl), [imageKeys]);

  const openGallery = (index: number) => {
    setActiveIndex(index);
    setGalleryOpen(true);
  };

  if (loading) {
    return (
      <div className="site-page-shell bg-slate-50">
        <UserSiteHeader />
        <main className="site-container site-page-main min-w-0">
          <ArticleDetailSkeleton />
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="site-page-shell bg-slate-50">
        <UserSiteHeader />
        <main className="site-container site-page-main min-w-0 py-10 text-center text-slate-500">{m.articles.notFound}</main>
        <SiteFooter />
      </div>
    );
  }

  const date = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ar-OM', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  const share = () => {
    if (navigator.share) {
      navigator.share({ title, url: window.location.href }).catch(() => undefined);
      return;
    }
    navigator.clipboard?.writeText(window.location.href).catch(() => undefined);
  };

  return (
    <div className="site-page-shell bg-slate-50">
      <UserSiteHeader />
      <main className="site-container site-page-main min-w-0">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
          {/* عمود الصور */}
          <div className="lg:sticky lg:top-24">
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
              <button
                type="button"
                onClick={() => openGallery(activeIndex)}
                className="group relative block w-full cursor-zoom-in"
                aria-label={m.articles.openGallery}
              >
                <img
                  src={resolvedImages[activeIndex]}
                  alt={title}
                  className="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                />
                <span className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-bold text-white">
                  <Expand size={14} />
                  {m.articles.openGallery}
                </span>
              </button>

              {resolvedImages.length > 1 ? (
                <div className="grid grid-cols-4 gap-2 p-3 sm:grid-cols-5">
                  {resolvedImages.map((image, index) => (
                    <button
                      key={imageKeys[index]}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      onDoubleClick={() => openGallery(index)}
                      className={`aspect-square overflow-hidden rounded-xl border-2 transition ${
                        activeIndex === index ? 'border-brand-500 ring-2 ring-brand-200' : 'border-transparent hover:border-slate-200'
                      }`}
                    >
                      <img src={image} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* عمود المحتوى */}
          <div className="min-w-0">
            <article className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6">
              {categoryName ? (
                <span className="mb-3 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700">{categoryName}</span>
              ) : null}
              <h1 className="text-3xl font-black leading-tight text-slate-900 lg:text-4xl">{title}</h1>
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                {date ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={16} />
                    {date}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1.5">
                  <Eye size={16} />
                  {article.views} {m.articles.views}
                </span>
              </div>

              <div className="mt-6 flex min-w-0 flex-wrap items-center gap-4 border-y border-slate-100 py-4">
                <ArticleReactions articleId={article.id} />
                <ArticleSaveButton
                  articleId={article.id}
                  initialSaved={savedIds.includes(article.id)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 hover:bg-slate-50"
                />
                <button
                  type="button"
                  onClick={share}
                  aria-label={m.articles.share}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 hover:bg-slate-50"
                >
                  <Share2 size={20} className="text-slate-600" />
                  <span className="text-sm font-bold text-slate-700">{m.articles.share}</span>
                </button>
              </div>

              <div
                className="prose prose-slate mt-8 max-w-none leading-8 [&_img]:cursor-zoom-in [&_img]:rounded-xl [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6"
                dangerouslySetInnerHTML={{ __html: sanitizedBody }}
              />
            </article>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:mt-6 lg:p-6">
              <ArticleComments articleId={article.id} />
            </div>
          </div>
        </div>
      </main>

      {galleryOpen ? (
        <ListingImageGalleryModal
          images={resolvedImages}
          initialIndex={activeIndex}
          title={title}
          imageLabel={m.articles.imageLabel}
          dir={dir}
          onClose={(finalIndex) => {
            if (typeof finalIndex === 'number') setActiveIndex(finalIndex);
            setGalleryOpen(false);
          }}
        />
      ) : null}

      <SiteFooter />
    </div>
  );
}
