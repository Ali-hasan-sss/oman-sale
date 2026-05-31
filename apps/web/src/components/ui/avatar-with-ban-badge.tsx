import { Ban, User } from 'lucide-react';
import type { ReactNode } from 'react';

type AvatarWithBanBadgeProps = {
  src?: string | null;
  alt?: string;
  size?: number;
  isBlocked?: boolean;
  badgeLabel?: string;
  fallback?: ReactNode;
  className?: string;
};

export function AvatarWithBanBadge({
  src,
  alt = '',
  size = 56,
  isBlocked = false,
  badgeLabel,
  fallback,
  className = ''
}: AvatarWithBanBadgeProps) {
  const badgeSize = Math.round(size * 0.38);

  return (
    <div className={`relative inline-flex shrink-0 ${className}`} style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-green-600 to-teal-600 text-white"
        style={{ width: size, height: size }}
      >
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          fallback ?? <User size={size * 0.45} />
        )}
      </div>

      {isBlocked ? (
        <span
          className="absolute -right-0.5 -top-0.5 flex items-center justify-center rounded-full border-2 border-white bg-red-600 text-white"
          style={{ width: badgeSize, height: badgeSize }}
          title={badgeLabel}
        >
          <Ban size={badgeSize * 0.5} />
        </span>
      ) : null}

      {isBlocked && badgeLabel ? (
        <span className="absolute -bottom-2 left-1/2 max-w-[120%] -translate-x-1/2 truncate rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-extrabold text-white">
          {badgeLabel}
        </span>
      ) : null}
    </div>
  );
}
