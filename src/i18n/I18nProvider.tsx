// Wraps the whole app and holds the current language.
// Wrapping means every component inside can read the language with useT().

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { loadSetting, saveSetting } from "../lib/storage";
import { pickLocale, pickStartLanguage, translate } from "./translate";
import { I18nContext, type I18n } from "./useT";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState(() =>
    pickStartLanguage(loadSetting("lang"), navigator.languages ?? [navigator.language]),
  );

  // Tell the browser and screen readers which language the page is in,
  // so Spanish text is pronounced with a Spanish voice.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // useMemo keeps the same object between renders unless lang changes,
  // so components don't redraw for no reason.
  const value = useMemo<I18n>(
    () => ({
      lang,
      locale: pickLocale(lang, navigator.languages ?? [navigator.language]),
      setLang: (next) => {
        setLangState(next);
        saveSetting("lang", next);
      },
      t: (key, vars) => translate(lang, key, vars),
    }),
    [lang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
