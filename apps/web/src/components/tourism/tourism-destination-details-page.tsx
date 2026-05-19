'use client';

import { ArrowRight, Calendar, Mail, MapPin, Phone, Star } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { useEffect, useState } from 'react';

import { tourismDestinationDetails, tourismDestinations } from '@/data/tourism';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { siteContactEmail, siteContactPhone } from '@/lib/site-contact';

type ApiTourismDestination = {
  id: string;
  slug: string;
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  rating: string;
  ratingLabelAr: string;
  ratingLabelEn: string;
  aboutAr: string;
  aboutEn: string;
  highlightsAr: string[];
  highlightsEn: string[];
  activitiesAr: string[];
  activitiesEn: string[];
  bestTimeAr: string;
  bestTimeEn: string;
  addressAr: string;
  addressEn: string;
};

export function TourismDestinationDetailsPage({ destinationId }: { destinationId: string }) {
  const { locale, localizedPath } = useI18n();
  const [apiDestination, setApiDestination] = useState<ApiTourismDestination | null>(null);
  const [apiLoaded, setApiLoaded] = useState(false);
  const staticDestination = tourismDestinations.find((item) => item.id === destinationId);
  const staticDetails = tourismDestinationDetails[destinationId];

  useEffect(() => {
    let cancelled = false;
    setApiLoaded(false);
    api
      .get<{ data: ApiTourismDestination }>(`/tourism/destinations/${destinationId}`)
      .then((response) => {
        if (!cancelled) setApiDestination(response.data.data);
      })
      .catch(() => {
        if (!cancelled) setApiDestination(null);
      })
      .finally(() => {
        if (!cancelled) setApiLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [destinationId]);

  if (!apiDestination && (!staticDestination || !staticDetails)) {
    if (!apiLoaded) {
      return <div className="min-h-screen bg-gray-50 py-20 text-center text-gray-500">Loading...</div>;
    }
    notFound();
  }

  const title = apiDestination ? (locale === 'en' ? apiDestination.titleEn : apiDestination.titleAr) : staticDestination!.title[locale];
  const image = apiDestination?.imageUrl ?? staticDestination!.image;
  const rating = apiDestination?.rating ?? staticDetails!.rating;
  const ratingLabel = apiDestination ? (locale === 'en' ? apiDestination.ratingLabelEn : apiDestination.ratingLabelAr) : staticDetails!.ratingLabel[locale];
  const aboutTitle = locale === 'en' ? `About ${title}` : `عن ${title}`;
  const about = apiDestination ? (locale === 'en' ? apiDestination.aboutEn : apiDestination.aboutAr) : staticDetails!.about[locale];
  const highlights = apiDestination ? (locale === 'en' ? apiDestination.highlightsEn : apiDestination.highlightsAr) : staticDetails!.highlights[locale];
  const activities = apiDestination ? (locale === 'en' ? apiDestination.activitiesEn : apiDestination.activitiesAr) : staticDetails!.activities[locale];
  const bestTime = apiDestination ? (locale === 'en' ? apiDestination.bestTimeEn : apiDestination.bestTimeAr) : staticDetails!.bestTime[locale];
  const address = apiDestination ? (locale === 'en' ? apiDestination.addressEn : apiDestination.addressAr) : staticDetails!.address[locale];
  const homeLabel = locale === 'en' ? 'Home' : 'الرئيسية';
  const tourismLabel = locale === 'en' ? 'Tourist landmarks' : 'مناطق سلطنة عمان';
  const travelAdsLabel = locale === 'en' ? 'Travel and tourism listings' : 'إعلانات السفر والسياحة';
  const highlightsTitle = locale === 'en' ? 'Top highlights' : 'أبرز المعالم';
  const activitiesTitle = locale === 'en' ? 'Activities' : 'الأنشطة والفعاليات';
  const bestTimeTitle = locale === 'en' ? 'Best time to visit' : 'أفضل وقت للزيارة';
  const contactTitle = locale === 'en' ? 'Contact information' : 'معلومات الاتصال';
  const quickLinksTitle = locale === 'en' ? 'Quick links' : 'روابط سريعة';

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
        <Link className="hover:text-green-600" href={localizedPath('/')}>
          {homeLabel}
        </Link>
        <ArrowRight className="h-4 w-4" />
        <Link className="hover:text-green-600" href={localizedPath('/tourism')}>
          {tourismLabel}
        </Link>
        <ArrowRight className="h-4 w-4" />
        <span className="text-gray-900">{title}</span>
      </div>

      <section className="relative mb-8 h-96 overflow-hidden rounded-2xl">
        <img src={image} alt={title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-8 right-8">
          <h1 className="mb-2 text-5xl font-bold text-white">{title}</h1>
          <div className="flex items-center gap-2 text-white">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="font-bold">{rating}</span>
            <span className="text-sm">{ratingLabel}</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <ContentSection title={aboutTitle}>
            <p className="text-gray-700 leading-relaxed">{about}</p>
          </ContentSection>

          <ContentSection title={highlightsTitle}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {highlights.map((item) => (
                <BulletItem key={item}>{item}</BulletItem>
              ))}
            </div>
          </ContentSection>

          <ContentSection title={activitiesTitle}>
            <div className="space-y-3">
              {activities.map((item, index) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="font-bold text-green-600">{index + 1}.</span>
                  <span className="text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </ContentSection>

          <section className="rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 p-6">
            <div className="mb-3 flex items-center gap-3">
              <Calendar className="h-6 w-6 text-green-600" />
              <h2 className="text-2xl font-bold">{bestTimeTitle}</h2>
            </div>
            <p className="text-lg text-gray-700">{bestTime}</p>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-40 lg:self-start">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold">{contactTitle}</h3>
            <div className="space-y-4">
              <ContactRow icon={<Phone className="h-5 w-5 text-green-600" />} value={siteContactPhone} ltr />
              <ContactRow icon={<Mail className="h-5 w-5 text-green-600" />} value={siteContactEmail} ltr />
              <ContactRow icon={<MapPin className="mt-1 h-5 w-5 text-green-600" />} value={address} />
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <h3 className="mb-4 text-xl font-bold">{quickLinksTitle}</h3>
            <div className="space-y-2">
              <Link className="block text-blue-600 hover:text-blue-700" href={localizedPath('/tourism')}>
                {tourismLabel}
              </Link>
              <Link className="block text-blue-600 hover:text-blue-700" href={localizedPath('/all-listings')}>
                {travelAdsLabel}
              </Link>
              <Link className="block text-blue-600 hover:text-blue-700" href={localizedPath('/')}>
                {homeLabel}
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

function ContentSection({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>
      {children}
    </section>
  );
}

function BulletItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-2 h-2 w-2 rounded-full bg-green-600" />
      <span className="text-gray-700">{children}</span>
    </div>
  );
}

function ContactRow({ icon, ltr = false, value }: { icon: React.ReactNode; ltr?: boolean; value: string }) {
  return (
    <div className="flex items-start gap-3 text-gray-700">
      {icon}
      <span dir={ltr ? 'ltr' : undefined}>{value}</span>
    </div>
  );
}
