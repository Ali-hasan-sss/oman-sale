'use client';

import { AdminHeaderButtonsManagement } from '@/components/admin/admin-header-buttons-management';
import { AdminHeroBannersManagement } from '@/components/admin/admin-hero-banners-management';
import { AdminHeroManagement } from '@/components/admin/admin-hero-management';
import { useI18n } from '@/lib/i18n';

export function AdminHeroPage() {
  const { m } = useI18n();

  const sections = [
    { id: 'header-buttons', label: m.admin.headerButtonsTitle },
    { id: 'hero-slides', label: m.admin.heroManagement },
    { id: 'hero-banners', label: m.admin.bannerManagement }
  ] as const;

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-brand-800 p-8 text-white shadow-lg">
        <h1 className="text-3xl font-black">{m.admin.heroPageTitle}</h1>
        <p className="mt-2 max-w-3xl text-sm text-white/80">{m.admin.heroPageSubtitle}</p>
        <nav className="mt-6 flex flex-wrap gap-2" aria-label={m.admin.heroPageSections}>
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/25"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </section>

      <div id="header-buttons" className="scroll-mt-24">
        <AdminHeaderButtonsManagement />
      </div>
      <div id="hero-slides" className="scroll-mt-24">
        <AdminHeroManagement />
      </div>
      <div id="hero-banners" className="scroll-mt-24">
        <AdminHeroBannersManagement />
      </div>
    </div>
  );
}
