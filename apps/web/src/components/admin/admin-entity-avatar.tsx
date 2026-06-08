import { resolveMediaUrl } from '@/lib/media-url';

type AdminEntityAvatarProps = {
  src?: string | null;
  name?: string;
  className?: string;
};

export function AdminEntityAvatar({ src, name, className }: AdminEntityAvatarProps) {
  const initial = name?.trim().slice(0, 1).toUpperCase() ?? '?';
  const resolvedSrc = src ? resolveMediaUrl(src) : '';

  if (resolvedSrc && !resolvedSrc.startsWith('media:')) {
    return (
      <img
        src={resolvedSrc}
        alt={name ?? ''}
        className={`shrink-0 object-cover bg-slate-100 ${className ?? 'h-10 w-10 rounded-full'}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-slate-200 font-black text-slate-600 ${className ?? 'h-10 w-10 rounded-full'}`}
    >
      {initial}
    </div>
  );
}
