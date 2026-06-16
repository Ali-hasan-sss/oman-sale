import { Check } from 'lucide-react';

type VerifiedBadgeProps = {
  className?: string;
  size?: 'sm' | 'md';
  title?: string;
};

export function VerifiedBadge({ className = '', size = 'sm', title }: VerifiedBadgeProps) {
  const dimension = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const iconSize = size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3';

  return (
    <span
      title={title}
      aria-label={title}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[#1D9BF0] text-white ${dimension} ${className}`}
    >
      <Check aria-hidden className={iconSize} strokeWidth={3} />
    </span>
  );
}
