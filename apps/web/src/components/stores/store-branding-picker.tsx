'use client';

import { Camera, ImagePlus, Loader2, X } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';

import { MediaCompressionError, uploadMediaFile } from '@/lib/media-upload';
import { registerMediaPreviewUrl, resolveMediaUrl } from '@/lib/media-url';

type StoreBrandingPickerProps = {
  locale: string;
  logoUrl: string;
  coverUrl: string;
  storeName?: string;
  onLogoChange: (value: string) => void;
  onCoverChange: (value: string) => void;
};

/**
 * Cover + logo picker laid out like the public store card: a wide cover with the
 * square logo overlapping its bottom corner, so the owner sees the result while uploading.
 */
export function StoreBrandingPicker({
  locale,
  logoUrl,
  coverUrl,
  onLogoChange,
  onCoverChange
}: StoreBrandingPickerProps) {
  const isAr = locale !== 'en';
  const t = isAr
    ? {
        title: 'صورة المتجر والغلاف',
        hint: 'الشعار مربع (يفضّل 500×500)، والغلاف عريض (يفضّل 1500×500). يمكنك تغييرهما لاحقًا من صفحة متجري.',
        addCover: 'أضف صورة الغلاف',
        changeCover: 'تغيير الغلاف',
        addLogo: 'صورة المتجر',
        removeCover: 'حذف الغلاف',
        removeLogo: 'حذف الصورة',
        uploading: 'جارٍ الرفع...',
        tooLarge: 'تعذّر ضغط الصورة، اختر صورة أصغر.',
        failed: 'تعذّر رفع الصورة، حاول مرة أخرى.'
      }
    : {
        title: 'Store photo & cover',
        hint: 'Logo is square (500×500 recommended), cover is wide (1500×500). You can change both later from My store.',
        addCover: 'Add a cover image',
        changeCover: 'Change cover',
        addLogo: 'Store photo',
        removeCover: 'Remove cover',
        removeLogo: 'Remove photo',
        uploading: 'Uploading...',
        tooLarge: 'Could not compress this image, pick a smaller one.',
        failed: 'Upload failed, please try again.'
      };

  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'logo' | 'cover' | null>(null);
  const [error, setError] = useState('');

  const upload = async (event: ChangeEvent<HTMLInputElement>, target: 'logo' | 'cover') => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setError('');
    setBusy(target);
    try {
      const result = await uploadMediaFile(file, 'stores');
      registerMediaPreviewUrl(result.key, result.url);
      if (target === 'logo') onLogoChange(result.key);
      else onCoverChange(result.key);
    } catch (uploadError) {
      setError(uploadError instanceof MediaCompressionError ? t.tooLarge : t.failed);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <span className="mb-1 block text-sm font-bold">{t.title}</span>
      <p className="mb-3 text-xs text-slate-500">{t.hint}</p>

      <div className="relative pb-12">
        {/* cover */}
        <div className="relative h-40 overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-gradient-to-br from-brand-50 via-white to-slate-100 sm:h-48">
          {coverUrl ? (
            <img src={resolveMediaUrl(coverUrl)} alt="" className="h-full w-full object-cover" />
          ) : null}
          <button
            type="button"
            onClick={() => coverInput.current?.click()}
            disabled={busy !== null}
            className={`absolute inset-0 flex items-center justify-center transition ${
              coverUrl ? 'bg-black/0 hover:bg-black/25' : 'hover:bg-brand-50/60'
            }`}
          >
            <span
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold shadow-sm ${
                coverUrl ? 'bg-white/90 text-ink-900' : 'bg-white text-brand-700 ring-1 ring-brand-200'
              }`}
            >
              {busy === 'cover' ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
              {busy === 'cover' ? t.uploading : coverUrl ? t.changeCover : t.addCover}
            </span>
          </button>
          {coverUrl ? (
            <button
              type="button"
              onClick={() => onCoverChange('')}
              aria-label={t.removeCover}
              title={t.removeCover}
              className="absolute end-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow hover:bg-white hover:text-brick-600"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>

        {/* logo, overlapping the cover's bottom corner */}
        <div className="absolute bottom-0 start-5">
          <div className="relative">
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              disabled={busy !== null}
              aria-label={t.addLogo}
              className="group relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-700 text-3xl font-black text-white shadow-lg"
            >
              {logoUrl ? (
                <img src={resolveMediaUrl(logoUrl)} alt="" className="h-full w-full object-cover" />
              ) : (
                <Camera size={28} className="-mt-4 opacity-90" />
              )}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-black/55 py-1 text-[11px] font-bold text-white">
                {busy === 'logo' ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />}
                {busy === 'logo' ? t.uploading : t.addLogo}
              </span>
            </button>
            {logoUrl ? (
              <button
                type="button"
                onClick={() => onLogoChange('')}
                aria-label={t.removeLogo}
                title={t.removeLogo}
                className="absolute -end-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow ring-1 ring-slate-200 hover:text-brick-600"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {error ? <p className="mt-2 text-sm font-bold text-red-600">{error}</p> : null}

      <input ref={logoInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void upload(e, 'logo')} />
      <input ref={coverInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => void upload(e, 'cover')} />
    </div>
  );
}
