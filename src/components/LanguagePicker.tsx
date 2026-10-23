// Language menu. It lists every language file in src/i18n automatically.

import { LANGUAGES } from "../i18n/translate";
import { useT } from "../i18n/useT";

export function LanguagePicker() {
  const { t, lang, setLang } = useT();
  return (
    <label className="lang-picker">
      <span className="visually-hidden">{t("language.label")}</span>
      <select value={lang} onChange={(e) => setLang(e.target.value)}>
        {Object.entries(LANGUAGES).map(([code, messages]) => (
          <option key={code} value={code}>
            {messages._name}
          </option>
        ))}
      </select>
    </label>
  );
}
