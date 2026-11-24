import 'server-only';
import { cookies } from 'next/headers';
import { t as translate, type Lang, type MsgKey } from './copy';

export const LANG_COOKIE = 'lang';

/** Language chosen with the header toggle (cookie). Defaults to English. */
export function getLang(): Lang {
  return cookies().get(LANG_COOKIE)?.value === 'ta' ? 'ta' : 'en';
}

/** Server-side translator bound to the visitor's language. */
export function getT() {
  const lang = getLang();
  return (key: MsgKey, vars?: Record<string, string | number>) => translate(key, lang, vars);
}
