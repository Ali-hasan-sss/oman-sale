'use client';

import DOMPurify from 'isomorphic-dompurify';
import { useEffect, useMemo, useState } from 'react';

import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { fetchLegalDocument, type LegalKind } from '@/lib/legal';
import { siteContactEmail } from '@/lib/site-contact';
import { useI18n } from '@/lib/i18n';

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export function LegalPage({ kind }: { kind: LegalKind }) {
  const { dir, locale, m } = useI18n();
  const fallback = m.legal[kind];
  const fallbackSections = fallback.sections as LegalSection[];
  const [remote, setRemote] = useState<Awaited<ReturnType<typeof fetchLegalDocument>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchLegalDocument(kind, locale)
      .then((data) => {
        if (!cancelled) setRemote(data);
      })
      .catch(() => {
        if (!cancelled) setRemote(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [kind, locale]);

  const sanitizedBody = useMemo(() => (remote?.body ? DOMPurify.sanitize(remote.body) : ''), [remote?.body]);
  const useRemote = Boolean(remote?.body?.trim());
  const title = useRemote ? remote!.title : fallback.title;
  const lastUpdated = useRemote
    ? remote!.lastUpdated
      ? new Date(remote!.lastUpdated).toLocaleDateString(locale === 'en' ? 'en-GB' : 'ar-OM', {
          month: 'long',
          year: 'numeric'
        })
      : ''
    : fallback.lastUpdated;
  const contactTitle = useRemote ? remote!.contactTitle || fallback.contactTitle : fallback.contactTitle;
  const contactText = useRemote ? remote!.contactText || fallback.contactText : fallback.contactText;

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="site-container site-page-main site-page-main--narrower min-w-0 md:py-14">
        <header className="mb-10">
          <h1 className="mb-3 text-3xl font-black text-gray-900 md:text-4xl">{title}</h1>
          {lastUpdated ? <p className="text-sm text-gray-500">{lastUpdated}</p> : null}
          {!useRemote && fallback.intro ? (
            <p className="mt-4 text-base leading-relaxed text-gray-700">{fallback.intro}</p>
          ) : null}
        </header>

        <article className="space-y-8 rounded-2xl bg-white p-6 shadow-sm md:p-10">
          {loading ? (
            <p className="text-sm text-gray-500">{m.admin.loading}</p>
          ) : useRemote ? (
            <div
              className="prose prose-slate max-w-none leading-8 [&_a]:text-green-700 [&_a]:underline [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_ol]:list-decimal [&_ol]:ps-6 [&_ul]:list-disc [&_ul]:ps-6"
              dangerouslySetInnerHTML={{ __html: sanitizedBody }}
            />
          ) : (
            fallbackSections.map((section) => (
              <section key={section.title}>
                <h2 className="mb-3 text-xl font-bold text-gray-900">{section.title}</h2>
                <div className="space-y-3 text-sm leading-7 text-gray-700 md:text-base">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                  {section.bullets?.length ? (
                    <ul className="list-disc space-y-2 ps-5">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))
          )}

          <section className="border-t border-gray-100 pt-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">{contactTitle}</h2>
            <p className="text-sm leading-7 text-gray-700 md:text-base">
              {contactText}{' '}
              <a href={`mailto:${siteContactEmail}`} className="font-bold text-green-700 hover:underline" dir="ltr">
                {siteContactEmail}
              </a>
            </p>
          </section>
        </article>
      </main>

      <SiteFooter />
    </div>
  );
}
