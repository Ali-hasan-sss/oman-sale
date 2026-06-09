type SiteBrandMarkProps = {
  variant?: 'light' | 'hero';
  className?: string;
};

export function SiteBrandMark({ variant = 'light', className = '' }: SiteBrandMarkProps) {
  const isHero = variant === 'hero';

  return (
    <span className={`flex flex-col leading-tight ${className}`}>
      <span
        className={
          isHero
            ? 'text-xl font-black text-white drop-shadow md:text-2xl'
            : 'text-lg font-black text-slate-900 sm:text-xl'
        }
        dir="ltr"
      >
        Oman Sale
      </span>
      <span className={isHero ? 'text-sm font-bold text-white/90 drop-shadow' : 'text-xs font-bold text-slate-600 sm:text-sm'}>
        عمان سيل
      </span>
    </span>
  );
}
