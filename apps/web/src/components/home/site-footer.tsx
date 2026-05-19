'use client';

import { ArrowUp, Facebook, Instagram, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { siteContactEmail, siteContactPhone } from '@/lib/site-contact';

type FooterCategory = {
  id: string;
  name: string;
  slug: string;
};

type FooterTourismDestination = {
  id: string;
  slug: string;
  titleAr: string;
  titleEn: string;
};

export function SiteFooter() {
  const { locale, m } = useI18n();
  const [categories, setCategories] = useState<FooterCategory[]>([]);
  const [tourismDestinations, setTourismDestinations] = useState<FooterTourismDestination[]>([]);
  const footerCategories = categories.map((category) => [category.name, `/category/${category.slug}`] as [string, string]);
  const footerRegions = tourismDestinations.map((destination) => [
    locale === 'en' ? destination.titleEn : destination.titleAr,
    `/destination/${destination.slug}`
  ] as [string, string]);

  useEffect(() => {
    api
      .get<{ data: FooterCategory[] }>('/categories', { params: { locale } })
      .then((response) => setCategories(response.data.data.slice(0, 6)))
      .catch(() => setCategories([]));
  }, [locale]);

  useEffect(() => {
    api
      .get<{ data: FooterTourismDestination[] }>('/tourism/destinations')
      .then((response) => setTourismDestinations(response.data.data.slice(0, 6)))
      .catch(() => setTourismDestinations([]));
  }, []);

  return (
    <footer className="bg-ink-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 border-b border-slate-800 pb-12 lg:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-20 w-20 items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="Oman Sale" className="h-full w-full object-contain" />
              </span>
              <span className="text-2xl font-black">Oman Sale</span>
            </div>
            <p className="mb-6 text-sm leading-relaxed text-slate-400">{m.footer.description}</p>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-brand-500" />
                <span className="text-slate-300" dir="ltr">{siteContactEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-brand-500" />
                <span className="text-slate-300" dir="ltr">{siteContactPhone}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={16} className="text-brand-500" />
                <span className="text-slate-300">{m.footer.location}</span>
              </div>
            </div>
          </div>

          <FooterList title={m.footer.categories} items={footerCategories} />
          <FooterList title={m.footer.regions} items={footerRegions} />
        </div>


        <div className="flex flex-col items-center justify-between gap-4 pt-8 md:flex-row">
          <p className="text-sm text-slate-400">{m.footer.copyright}</p>
          <div className="flex items-center gap-4">
            {[Twitter, Instagram, Facebook, Youtube].map((Icon, index) => (
              <Link
                key={index}
                href="#"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-900 transition hover:bg-brand-600"
              >
                <Icon size={18} />
              </Link>
            ))}
            <a
              href="#top"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 transition hover:bg-brand-700"
              aria-label={m.footer.backToTop}
            >
              <ArrowUp size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, items }: { title: string; items: Array<[string, string]> }) {
  const { localizedPath } = useI18n();

  return (
    <div>
      <h4 className="mb-4 font-bold">{title}</h4>
      <ul className="space-y-3 text-sm">
        {items.map(([label, href]) => (
          <li key={label}>
            <Link href={localizedPath(href)} className="text-slate-400 transition hover:text-brand-500">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
