'use client';

import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MouseEvent, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

type FavoriteButtonProps = {
  adId: string;
  initialFavorited?: boolean;
  className?: string;
  iconSize?: number;
  onChange?: (favorited: boolean) => void;
};

export function FavoriteButton({ adId, className, iconSize = 18, initialFavorited = false, onChange }: FavoriteButtonProps) {
  const router = useRouter();
  const { localizedPath, m } = useI18n();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsFavorited(initialFavorited);
  }, [initialFavorited]);

  const toggleFavorite = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const token = getUserAccessToken();
    if (!token) {
      router.push(localizedPath('/login'));
      return;
    }

    const nextValue = !isFavorited;
    setIsSaving(true);
    setIsFavorited(nextValue);
    onChange?.(nextValue);

    try {
      if (nextValue) {
        await api.post(`/ads/${adId}/favorite`, {}, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await api.delete(`/ads/${adId}/favorite`, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch {
      setIsFavorited(!nextValue);
      onChange?.(!nextValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      aria-label={m.common.favorite}
      className={className}
      disabled={isSaving}
      onClick={toggleFavorite}
      type="button"
    >
      <Heart
        size={iconSize}
        className={isFavorited ? 'fill-red-500 text-red-500' : 'text-gray-600'}
      />
    </button>
  );
}
