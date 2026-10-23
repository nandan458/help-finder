// The very first screen: pick your language. Each language is a big button
// written in that language, so people can find theirs even if they can't read
// the rest of the screen. Every language file in src/i18n shows up here on its own.

import { APP_NAME } from "../config";
import { LANGUAGES, translate } from "../i18n/translate";
import { useT } from "../i18n/useT";
import "./LanguageScreen.css";

// Most-spoken languages in the U.S. first. Any new language file is added at the end.
const ORDER = ["en", "es", "zh", "tl", "vi", "ko", "fr", "ht", "ru"];

type Props = { onChosen: () => void };

export function LanguageScreen({ onChosen }: Props) {
  const { lang, setLang } = useT();
  const codes = [
    ...ORDER.filter((code) => code in LANGUAGES),
    ...Object.keys(LANGUAGES).filter((code) => !ORDER.includes(code)),
  ];

  return (
    <main className="language-screen">
      <h1>{APP_NAME}</h1>
      {/* "Choose your language" in the phone's language and in English. */}
      <p className="language-title" lang={lang}>
        {translate(lang, "language.title")}
        {lang !== "en" && <span lang="en"> · {translate("en", "language.title")}</span>}
      </p>
      <ul className="language-list">
        {codes.map((code) => (
          <li key={code}>
            <button
              type="button"
              className="language-button"
              lang={code}
              onClick={() => {
                setLang(code);
                onChosen();
              }}
            >
              {LANGUAGES[code]._name}
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
