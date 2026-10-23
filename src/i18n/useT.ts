// The React side of translations. Any component can call useT() to get:
//   t("key")      the text in the current language
//   lang          the current language code, like "en"
//   locale        the language plus region for dates and times, like "en-US"
//   setLang(code) switch languages (remembered on this device)

import { createContext, useContext } from "react";
import { DEFAULT_LANG, translate, type Vars } from "./translate";

export type I18n = {
  lang: string;
  locale: string;
  setLang: (lang: string) => void;
  t: (key: string, vars?: Vars) => string;
};

export const I18nContext = createContext<I18n>({
  lang: DEFAULT_LANG,
  locale: DEFAULT_LANG,
  setLang: () => {},
  t: (key, vars) => translate(DEFAULT_LANG, key, vars),
});

export function useT(): I18n {
  return useContext(I18nContext);
}
