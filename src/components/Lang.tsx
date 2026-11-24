'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext } from 'react';
import { t as translate, type Lang, type MsgKey } from '@/lib/copy';

const LangContext = createContext<Lang>('en');

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

/** Client-side translator: const t = useT(); t('login.title') */
export function useT() {
  const lang = useContext(LangContext);
  return useCallback((key: MsgKey, vars?: Record<string, string | number>) => translate(key, lang, vars), [lang]);
}

/** Small EN / தமிழ் switch. Stores the choice in a cookie for a year. */
export function LangToggle({ className = '' }: { className?: string }) {
  const lang = useLang();
  const router = useRouter();
  const t = useT();
  return (
    <button
      type="button"
      aria-label={t('lang.switchLabel')}
      onClick={() => {
        document.cookie = `lang=${lang === 'en' ? 'ta' : 'en'}; path=/; max-age=31536000; samesite=lax`;
        router.refresh();
      }}
      className={`min-h-[36px] rounded-full border border-line bg-white px-3 text-xs font-medium text-navy hover:border-gold ${className}`}
    >
      {t('lang.switch')}
    </button>
  );
}
