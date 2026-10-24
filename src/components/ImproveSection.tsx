// Settings → "Improve the map": where the places come from, and how anyone
// can fix a wrong place or add a missing one, which closes the loop: the
// volunteers' fixes reach this app with the next weekly update.

import { useT } from "../i18n/useT";

export function ImproveSection() {
  const { t } = useT();
  return (
    <section className="settings-section" aria-labelledby="improve-title">
      <h3 id="improve-title">{t("improve.title")}</h3>
      <p>{t("improve.about")}</p>
      <ul className="improve-links">
        <li>
          <a href="https://learnosm.org/en/beginner/" target="_blank" rel="noreferrer">
            {t("improve.how")}
          </a>
        </li>
        <li>
          <a href="https://www.openstreetmap.org/fixthemap" target="_blank" rel="noreferrer">
            {t("map.reportError")}
          </a>
        </li>
      </ul>
    </section>
  );
}
