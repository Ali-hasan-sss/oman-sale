'use client';

import { SiteFooter } from '@/components/home/site-footer';
import { SiteHeaderSearch, UserSiteHeader } from '@/components/navigation/user-site-header';
import { siteContactEmail } from '@/lib/site-contact';
import { useI18n } from '@/lib/i18n';

type LegalKind = 'privacy' | 'terms';

type LegalSection = {
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

export function LegalPage({ kind }: { kind: LegalKind }) {
  const { dir, m } = useI18n();
  const content = m.legal[kind];
  const sections = content.sections as LegalSection[];

  return (
    <div className="site-page-shell bg-gray-50" dir={dir}>
      <UserSiteHeader>
        <SiteHeaderSearch />
      </UserSiteHeader>

      <main className="site-container site-page-main site-page-main--narrower min-w-0 md:py-14">
        <header className="mb-10">
          <h1 className="mb-3 text-3xl font-black text-gray-900 md:text-4xl">{content.title}</h1>
          <p className="text-sm text-gray-500">{content.lastUpdated}</p>
          <p className="mt-4 text-base leading-relaxed text-gray-700">{content.intro}</p>
        </header>

        <article className="space-y-8 rounded-2xl bg-white p-6 shadow-sm md:p-10">
          {sections.map((section) => (
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
          ))}

          <section className="border-t border-gray-100 pt-6">
            <h2 className="mb-3 text-xl font-bold text-gray-900">{content.contactTitle}</h2>
            <p className="text-sm leading-7 text-gray-700 md:text-base">
              {content.contactText}{' '}
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
