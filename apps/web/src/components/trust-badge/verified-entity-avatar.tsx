import { AdminEntityAvatar } from '@/components/admin/admin-entity-avatar';
import { VerifiedBadge } from '@/components/trust-badge/verified-badge';

type VerifiedEntityAvatarProps = {
  src?: string | null;
  name?: string;
  className?: string;
  verified?: boolean;
  verifiedTitle?: string;
  badgeClassName?: string;
};

export function VerifiedEntityAvatar({
  src,
  name,
  className,
  verified,
  verifiedTitle,
  badgeClassName = ''
}: VerifiedEntityAvatarProps) {
  return (
    <span className="relative inline-flex shrink-0">
      <AdminEntityAvatar src={src} name={name} className={className} />
      {verified ? (
        <VerifiedBadge
          title={verifiedTitle}
          className={`absolute -bottom-0.5 -end-0.5 border-2 border-white ${badgeClassName}`}
        />
      ) : null}
    </span>
  );
}
