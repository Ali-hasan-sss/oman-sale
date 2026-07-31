'use client';

import { Loader2, Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';

import { api } from '@/lib/api';
import {
  buildScopedSearchUrl,
  buildSuggestionUrl,
  stripLocalePrefix,
  type GlobalSearchScope,
  type SearchSuggestion
} from '@/lib/header-search';
import { useI18n } from '@/lib/i18n';

const MIN_SUGGESTIONS_LENGTH = 1;
const SUGGESTIONS_DEBOUNCE_MS = 300;

type GlobalHeaderSearchProps = {
  className?: string;
  variant?: 'default' | 'hero';
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
};

export function GlobalHeaderSearch({
  className,
  variant = 'default',
  value: controlledValue,
  onChange: controlledOnChange,
  onSubmit: controlledOnSubmit
}: GlobalHeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { dir, locale, localizedPath, m } = useI18n();
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledValue !== undefined;
  const [localValue, setLocalValue] = useState('');
  const [scope, setScope] = useState<GlobalSearchScope>('all');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const urlQuery = searchParams.get('q') ?? '';
  const value = isControlled ? controlledValue : localValue;
  const trimmed = value.trim();

  useEffect(() => {
    if (!isControlled) setLocalValue(urlQuery);
  }, [urlQuery, isControlled]);
  const showPanel = isOpen && trimmed.length >= MIN_SUGGESTIONS_LENGTH;

  useEffect(() => {
    if (!showPanel) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setLoadingSuggestions(true);
      api
        .get<{ data: { suggestions: SearchSuggestion[] } }>('/search/suggestions', {
          params: { q: trimmed, locale, limit: 5 },
          signal: controller.signal
        })
        .then((response) => setSuggestions(response.data.data.suggestions))
        .catch(() => setSuggestions([]))
        .finally(() => setLoadingSuggestions(false));
    }, SUGGESTIONS_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [trimmed, locale, showPanel]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const setValue = (nextValue: string) => {
    if (isControlled) controlledOnChange?.(nextValue);
    else setLocalValue(nextValue);
  };

  const navigate = (href: string) => {
    setIsOpen(false);
    router.push(href);
  };

  const submit = () => {
    const term = trimmed;
    if (controlledOnSubmit) {
      controlledOnSubmit(term);
      setIsOpen(false);
      return;
    }
    navigate(buildScopedSearchUrl(scope, term, localizedPath));
  };

  const clearSearch = () => {
    setValue('');
    setSuggestions([]);
    setIsOpen(false);
    if (controlledOnSubmit) return;
    const hasSearchQuery = stripLocalePrefix(pathname) === '/search' && searchParams.get('q');
    if (hasSearchQuery) navigate(localizedPath('/search'));
  };

  const scopeOptions: Array<{ id: GlobalSearchScope; label: string }> = [
    { id: 'listings', label: m.headerSearch.scopeListings },
    { id: 'articles', label: m.headerSearch.scopeArticles },
    { id: 'tourism', label: m.headerSearch.scopeTourism },
    { id: 'stores', label: m.headerSearch.scopeStores }
  ];

  const typeLabels: Record<SearchSuggestion['type'], string> = {
    listing: m.headerSearch.suggestionListing,
    category: m.headerSearch.suggestionCategory,
    article: m.headerSearch.suggestionArticle,
    tourism: m.headerSearch.suggestionTourism,
    store: m.headerSearch.suggestionStore
  };

  const inputClass =
    variant === 'hero'
      ? `w-full rounded-xl border border-white/60 bg-white/95 py-3 text-sm shadow-lg outline-none backdrop-blur-sm transition focus:ring-2 focus:ring-brand-500 sm:py-4 sm:text-base ${
          dir === 'rtl' ? 'pl-12 pr-12' : 'pl-12 pr-12'
        }`
      : `w-full rounded-lg border border-gray-300 py-3 outline-none focus:ring-2 focus:ring-green-500 ${
          dir === 'rtl' ? 'pl-12 pr-12' : 'pl-12 pr-12'
        }`;

  const iconClass =
    variant === 'hero'
      ? `absolute top-1/2 -translate-y-1/2 text-slate-400 ${dir === 'rtl' ? 'right-4' : 'left-4'}`
      : `absolute top-1/2 -translate-y-1/2 text-gray-400 ${dir === 'rtl' ? 'right-3' : 'left-3'}`;

  const clearClass =
    variant === 'hero'
      ? `absolute top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600 ${dir === 'rtl' ? 'left-3' : 'right-3'}`
      : `absolute top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-600 ${dir === 'rtl' ? 'left-3' : 'right-3'}`;

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Search className={iconClass} size={20} />
        <input
          type="search"
          value={value}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listboxId}
          aria-autocomplete="list"
          onFocus={() => setIsOpen(true)}
          onChange={(event) => {
            setValue(event.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Escape') setIsOpen(false);
          }}
          placeholder={m.headerSearch.globalPlaceholder}
          className={inputClass}
        />
        {trimmed ? (
          <button type="button" onClick={clearSearch} aria-label={m.headerSearch.clearSearch} className={clearClass}>
            <X size={18} />
          </button>
        ) : null}
      </form>

      {showPanel ? (
        <div
          id={listboxId}
          role="listbox"
          className={`absolute start-0 top-[calc(100%+0.5rem)] z-[60] w-full overflow-hidden rounded-2xl border bg-white shadow-xl ${
            variant === 'hero' ? 'border-white/80' : 'border-slate-200'
          }`}
        >
          <div className="max-h-72 overflow-y-auto">
            {loadingSuggestions ? (
              <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin" />
                {m.headerSearch.suggestionsLoading}
              </div>
            ) : suggestions.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">{m.headerSearch.suggestionsEmpty}</p>
            ) : (
              <ul>
                {suggestions.map((suggestion) => (
                  <li key={`${suggestion.type}-${suggestion.id}`}>
                    <button
                      type="button"
                      role="option"
                      onClick={() => navigate(buildSuggestionUrl(suggestion, localizedPath))}
                      className="flex w-full items-center gap-3 px-4 py-3 text-start transition hover:bg-slate-50"
                    >
                      <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                        {typeLabels[suggestion.type]}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-800">{suggestion.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-slate-100 bg-slate-50 px-3 py-2.5">
            <div className="flex flex-wrap gap-2">
              {scopeOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setScope(option.id);
                    if (trimmed) navigate(buildScopedSearchUrl(option.id, trimmed, localizedPath));
                  }}
                  className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
                    scope === option.id
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-slate-700 shadow-sm hover:bg-slate-100'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
