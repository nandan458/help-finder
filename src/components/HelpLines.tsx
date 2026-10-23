// Phone numbers for urgent help: 911, 988, and 211. They're always one tap
// away (the "Help lines" button opens them in a pop-up), and they also appear
// on their own when a search finds very few places, so no one leaves empty-handed.
//
// These are U.S. numbers. The note at the bottom says so.

import { useState } from "react";
import { useT } from "../i18n/useT";
import { Dialog } from "./Dialog";
import { UiIcon } from "./UiIcon";

const LINES = [
  { id: "911", tel: "911", text: false },
  { id: "988", tel: "988", text: true }, // 988 also answers text messages
  { id: "211", tel: "211", text: false },
] as const;

/** The list of help lines. Used in the pop-up and on the results screen. */
export function HelpLinesList() {
  const { t } = useT();
  return (
    <div className="help-lines">
      <ul>
        {LINES.map((line) => (
          <li key={line.id} className="help-line">
            <div>
              <p className="help-line-name">{t(`help.${line.id}.name`)}</p>
              <p className="muted">{t(`help.${line.id}.about`)}</p>
            </div>
            <div className="help-line-actions">
              <a className="button" href={`tel:${line.tel}`}>
                {t("help.call", { number: line.tel })}
              </a>
              {line.text && (
                <a className="button button-secondary" href={`sms:${line.tel}`}>
                  {t("help.text", { number: line.tel })}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="muted help-note">{t("help.note")}</p>
    </div>
  );
}

/** A "Help lines" button that opens the list in a pop-up. */
export function HelpLinesButton() {
  const { t } = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" className="button button-help" onClick={() => setOpen(true)}>
        <UiIcon name="help" />
        {t("help.button")}
      </button>
      <Dialog open={open} onClose={() => setOpen(false)} title={t("help.title")}>
        <HelpLinesList />
      </Dialog>
    </>
  );
}
