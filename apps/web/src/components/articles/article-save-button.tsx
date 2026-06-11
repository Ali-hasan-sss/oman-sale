'use client';

import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { MouseEvent, useEffect, useState } from 'react';

import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';
import { getUserAccessToken } from '@/lib/user-auth';

type ArticleSaveButtonProps = {
  articleId: string;
  initialSaved?: boolean;
  className?: string;
  showLabel?: boolean;
  onChange?: (saved: boolean) => void;
};

export function ArticleSaveButton({ articleId, className, initialSaved = false, showLabel = true, onChange }: ArticleSaveButtonProps) {
  const router = useRouter();
  const { localizedPath, m } = useI18n();
  const [isSaved, setIsSaved] = useState(initialSaved);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsSaved(initialSaved);
  }, [initialSaved]);

  const toggleSave = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const token = getUserAccessToken();
    if (!token) {
      router.push(localizedPath('/login'));
      return;
    }

    const nextValue = !isSaved;
    setIsSaving(true);
    setIsSaved(nextValue);
    onChange?.(nextValue);

    try {
      if (nextValue) {
        await api.post(`/articles/${articleId}/save`, {}, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await api.delete(`/articles/${articleId}/save`, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch {
      setIsSaved(!nextValue);
      onChange?.(!nextValue);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      aria-label={m.articles.save}
      className={className}
      disabled={isSaving}
      onClick={toggleSave}
    >
      <Bookmark size={20} className={isSaved ? 'fill-brand-600 text-brand-600' : 'text-slate-600'} />
      {showLabel ? <span className="text-sm font-bold">{isSaved ? m.articles.saved : m.articles.save}</span> : null}
    </button>
  );
}
