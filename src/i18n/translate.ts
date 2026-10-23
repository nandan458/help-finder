// Translation logic, kept separate from React so it is easy to test.
//
// Every *.json file in this folder is one language. The file name is the
// language code (en.json = English, es.json = Spanish). To add a language,
// copy en.json to a new file such as fr.json and translate the values.
// Nothing else needs to change: the line below finds the new file on its own.

export type Messages = Record<string, string>;
export type Vars = Record<string, string | number>;

const files = import.meta.glob<Messages>("./*.json", { eager: true, import: "default" });

// Turn "./es.json" into "es".
export const LANGUAGES: Record<string, Messages> = Object.fromEntries(
  Object.entries(files).map(([path, messages]) => [path.slice(2, -5), messages]),
);

export const DEFAULT_LANG = "en";

/**
 * Look up a message and fill in its {placeholders}.
 * If the key has `.one` / `.other` versions and vars.count is set, the right
 * plural is chosen for the language ("1 place" vs "2 places").
 * Missing keys fall back to English, then to the key itself, so a missing
 * translation never shows a blank.
 */
export function translate(lang: string, key: string, vars: Vars = {}): string {
  let fullKey = key;
  if (typeof vars.count === "number") {
    const form = new Intl.PluralRules(lang).select(vars.count) === "one" ? "one" : "other";
    fullKey = `${key}.${form}`;
  }
  const text = LANGUAGES[lang]?.[fullKey] ?? LANGUAGES[DEFAULT_LANG]?.[fullKey] ?? fullKey;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Choose the language to start in: the one the user picked before, else the
 * phone's language if we have it (for example "es-MX" becomes "es"), else English.
 */
export function pickStartLanguage(saved: string | null, browserLangs: readonly string[]): string {
  if (saved && saved in LANGUAGES) return saved;
  for (const tag of browserLangs) {
    const code = tag.toLowerCase().split("-")[0];
    if (code in LANGUAGES) return code;
  }
  return DEFAULT_LANG;
}

/**
 * The locale for dates and times. If the phone's language matches the app's
 * (for example "es-US" while the app is in Spanish), use it, so a Spanish
 * speaker in the U.S. sees "5:00 p.m." Otherwise use the app's language.
 */
export function pickLocale(lang: string, browserLangs: readonly string[]): string {
  return browserLangs.find((tag) => tag.toLowerCase().split("-")[0] === lang) ?? lang;
}
