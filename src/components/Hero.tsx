// The colorful top of the start screens: logo, name, a one-line promise, and
// four badges that say what makes the app different. Used by the language
// chooser and the "What do you need?" screen.

import { APP_NAME } from "../config";
import { LANGUAGES } from "../i18n/translate";
import { useT } from "../i18n/useT";
import "./Hero.css";

/** `compact` is the shorter version for later screens: a smaller logo and no badges. */
export function Hero({ compact = false }: { compact?: boolean }) {
  const { t } = useT();
  // The badge says how many languages there are, counted from the language files.
  const total = Object.keys(LANGUAGES).length;
  const badges = [
    t("hero.badge.free"),
    t("hero.badge.noAccount"),
    t("hero.badge.languages", { total }),
    t("hero.badge.offline"),
  ];

  return (
    <header className={compact ? "hero hero-compact" : "hero"}>
      {/* The logo is decoration: the name is written right next to it. */}
      <img
        className="hero-logo"
        src={`${import.meta.env.BASE_URL}pwa-192x192.png`}
        alt=""
        width={compact ? 52 : 72}
        height={compact ? 52 : 72}
      />
      <h1>{APP_NAME}</h1>
      <p className="hero-tagline">{t("hero.tagline")}</p>
      {!compact && (
        <ul className="hero-badges">
          {badges.map((badge) => (
            <li key={badge}>{badge}</li>
          ))}
        </ul>
      )}
    </header>
  );
}
