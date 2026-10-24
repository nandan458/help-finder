// Settings: appearance, language, text size, what happens to your data,
// and a button to clear everything this app keeps on the phone.

import { useState } from "react";
import { useT } from "../i18n/useT";
import type { LatLng } from "../lib/geo";
import {
  loadTextSize,
  loadTheme,
  setTextSize,
  setTheme,
  type TextSize,
  type Theme,
} from "../lib/settings";
import { Dialog } from "./Dialog";
import { ImproveSection } from "./ImproveSection";
import { LanguagePicker } from "./LanguagePicker";
import { OfflineSection } from "./OfflineSection";

type Props = {
  open: boolean;
  where: LatLng; // where the person is searching, to offer that state for offline use
  onClose: () => void;
  onClearData: () => Promise<void>;
};

export function SettingsDialog({ open, where, onClose, onClearData }: Props) {
  const { t } = useT();
  const [theme, setThemeState] = useState<Theme>(loadTheme);
  const [textSize, setTextSizeState] = useState<TextSize>(loadTextSize);
  const [cleared, setCleared] = useState(false);

  async function clearData() {
    // A real "Are you sure?" from the browser, since this can't be undone.
    if (!window.confirm(t("settings.clearConfirm"))) return;
    await onClearData();
    setCleared(true);
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        setCleared(false);
        onClose();
      }}
      title={t("settings.title")}
    >
      <div className="settings">
        <Choice
          legend={t("settings.appearance")}
          name="theme"
          value={theme}
          options={["auto", "light", "dark"] as const}
          label={(option) => t(`settings.theme.${option}`)}
          onChange={(next) => {
            setThemeState(next);
            setTheme(next);
          }}
        />

        <div className="settings-row">
          {/* The menu has its own hidden label; this visible one is just for eyes. */}
          <span className="settings-label" aria-hidden="true">
            {t("language.label")}
          </span>
          <LanguagePicker />
        </div>

        <Choice
          legend={t("settings.textSize")}
          name="text-size"
          value={textSize}
          options={["normal", "large"] as const}
          label={(option) => t(`settings.text.${option}`)}
          onChange={(next) => {
            setTextSizeState(next);
            setTextSize(next);
          }}
        />

        {open && <OfflineSection where={where} />}

        <ImproveSection />

        <section className="settings-section" aria-labelledby="privacy-title">
          <h3 id="privacy-title">{t("privacy.title")}</h3>
          <p>{t("privacy.location")}</p>
          <p>{t("privacy.servers")}</p>
          <p>{t("privacy.device")}</p>
          <p className="muted">{t("privacy.history")}</p>
        </section>

        <section className="settings-section" aria-labelledby="data-title">
          <h3 id="data-title">{t("settings.data")}</h3>
          <p>{t("settings.clearAbout")}</p>
          <button type="button" className="button button-danger" onClick={() => void clearData()}>
            {t("settings.clear")}
          </button>
          {/* role="status" makes screen readers announce the result. */}
          <p role="status" className="settings-done">
            {cleared ? t("settings.cleared") : ""}
          </p>
        </section>
      </div>
    </Dialog>
  );
}

type ChoiceProps<T extends string> = {
  legend: string;
  name: string;
  value: T;
  options: readonly T[];
  label: (option: T) => string;
  onChange: (value: T) => void;
};

/**
 * A row of side-by-side choices where exactly one is picked (like Light /
 * Dark / Automatic). Under the hood they're ordinary radio buttons, so
 * keyboards and screen readers already know how to use them.
 */
function Choice<T extends string>({
  legend,
  name,
  value,
  options,
  label,
  onChange,
}: ChoiceProps<T>) {
  return (
    <fieldset className="choice">
      <legend className="settings-label">{legend}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span>{label(option)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
