// A pop-up window, used for Help lines and Settings.
// It's built on the browser's own <dialog> element, which keeps keyboard focus
// inside the pop-up, closes with Escape, and tells screen readers it's a
// dialog, all for free.

import { useEffect, useId, useRef, type ReactNode } from "react";
import { useT } from "../i18n/useT";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

export function Dialog({ open, onClose, title, children }: Props) {
  const { t } = useT();
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // React says whether it should be open; this makes the real <dialog> match.
  useEffect(() => {
    const el = dialog.current;
    if (open && !el?.open) el?.showModal();
    if (!open && el?.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="dialog"
      aria-labelledby={titleId}
      // Fires when it closes for any reason, including the Escape key.
      onClose={onClose}
      // A click on the dark area outside the box closes it.
      onClick={(e) => e.target === dialog.current && onClose()}
    >
      <div className="dialog-top">
        <h2 id={titleId}>{title}</h2>
        <button type="button" className="link-button" onClick={onClose}>
          {t("common.close")}
        </button>
      </div>
      {children}
    </dialog>
  );
}
