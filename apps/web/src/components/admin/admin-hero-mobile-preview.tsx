'use client';

import { useI18n } from '@/lib/i18n';

type AdminHeroMobilePreviewProps = {
  imageUrl: string;
  titleAr: string;
  titleEn: string;
  subtitleAr: string;
  subtitleEn: string;
  buttonLabelAr: string;
  buttonLabelEn: string;
};

export function AdminHeroMobilePreview({
  imageUrl,
  titleAr,
  titleEn,
  subtitleAr,
  subtitleEn,
  buttonLabelAr,
  buttonLabelEn
}: AdminHeroMobilePreviewProps) {
  const { locale, m } = useI18n();
  const isAr = locale === 'ar';
  const title = isAr ? titleAr : titleEn;
  const subtitle = isAr ? subtitleAr : subtitleEn;
  const buttonLabel = isAr ? buttonLabelAr : buttonLabelEn;

  return (
    <div className="md:col-span-2">
      <p className="mb-2 text-sm font-bold text-slate-700">{m.admin.heroMobilePreview}</p>
      <p className="mb-3 text-xs text-slate-500">{m.admin.heroMobilePreviewHint}</p>
      <div className="mx-auto max-w-xs rounded-[2rem] border-4 border-slate-800 bg-slate-900 p-3 shadow-xl">
        <div className="overflow-hidden rounded-2xl bg-slate-100">
          <div className="relative min-h-[200px] overflow-hidden rounded-2xl shadow-md">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-brand-600 to-brand-800" />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-600/45 to-brand-800/55" />
            <div className={`relative z-10 flex min-h-[200px] flex-col justify-center p-6 ${isAr ? 'items-end text-right' : 'items-start text-left'}`}>
              <h4 className="mb-2 w-full text-2xl font-black leading-tight text-white">{title || '—'}</h4>
              <p className="mb-4 w-full text-sm leading-6 text-white/90">{subtitle || '—'}</p>
              <span className="inline-flex rounded-2xl bg-white px-4 py-2.5 text-sm font-black text-brand-800">
                {buttonLabel || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
