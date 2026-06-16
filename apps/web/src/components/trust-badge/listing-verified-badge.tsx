import { Check } from 'lucide-react';

type ListingVerifiedIndicatorProps = {
  label: string;
  size?: 'sm' | 'md';
  className?: string;
};

export function ListingVerifiedIndicator({ label, size = 'sm', className = '' }: ListingVerifiedIndicatorProps) {
  const isMd = size === 'md';

  return (
    <span
      title={label}
      aria-label={label}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full bg-[#1D9BF0]/12 font-bold text-[#1D9BF0] ring-1 ring-[#1D9BF0]/35 ${
        isMd ? 'px-3 py-1 text-xs' : 'px-2 py-0.5 text-[10px] leading-none'
      } ${className}`}
    >
      <span
        aria-hidden
        className={`inline-flex items-center justify-center rounded-full bg-[#1D9BF0] text-white ${
          isMd ? 'h-4 w-4' : 'h-3.5 w-3.5'
        }`}
      >
        <Check className={isMd ? 'h-2.5 w-2.5' : 'h-2 w-2'} strokeWidth={3} />
      </span>
      <span>{label}</span>
    </span>
  );
}

type ListingTitleWithVerifiedProps = {
  title: string;
  verified?: boolean;
  label: string;
  titleClassName?: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
};

export function ListingTitleWithVerified({
  title,
  verified,
  label,
  titleClassName = '',
  className = '',
  as: Tag = 'h3'
}: ListingTitleWithVerifiedProps) {
  return (
    <div className={`flex min-w-0 items-start gap-2 ${className}`}>
      <Tag className={`min-w-0 flex-1 font-bold text-gray-900 ${titleClassName}`}>{title}</Tag>
      {verified ? <ListingVerifiedIndicator label={label} className="mt-0.5" /> : null}
    </div>
  );
}

type SellerVerifiedBannerProps = {
  label: string;
  description: string;
  className?: string;
};

export function SellerVerifiedBanner({ label, description, className = '' }: SellerVerifiedBannerProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl border border-[#1D9BF0]/30 bg-gradient-to-r from-[#1D9BF0]/12 to-[#1D9BF0]/5 px-4 py-3 ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1D9BF0] text-white shadow-sm ring-2 ring-white">
        <Check size={20} strokeWidth={3} aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-black text-[#1D9BF0]">{label}</p>
        <p className="text-xs leading-relaxed text-gray-600">{description}</p>
      </div>
    </div>
  );
}
