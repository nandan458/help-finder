// The panel that holds the search box, filters, and list.
// On wide screens it's a frosted panel floating over the left of the map.
// On phones it's a "bottom sheet", like in map apps: it sits over the bottom
// of the map at one of three heights, and you drag its handle to change it.
// The handle is also a button: tap it (or press Enter) to step through the
// heights, so it works without dragging too.

import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { useT } from "../i18n/useT";
import { closestSize, SHEET_SIZES, sheetHeight, type SheetSize } from "./sheetSize";

type Props = {
  isPhone: boolean;
  screenHeight: number;
  size: SheetSize;
  onSize: (size: SheetSize) => void;
  labelledBy: string;
  header: ReactNode; // stays at the top, under the handle
  children: ReactNode; // scrolls
};

export function Sheet(props: Props) {
  const { isPhone, screenHeight, size, onSize, labelledBy, header, children } = props;
  const { t } = useT();
  // While a finger is dragging, the height follows it; otherwise it uses `size`.
  const [dragHeight, setDragHeight] = useState<number | null>(null);
  const justDragged = useRef(false);

  if (!isPhone) {
    return (
      <section className="panel" aria-labelledby={labelledBy}>
        {header}
        <div className="panel-body">{children}</div>
      </section>
    );
  }

  const minHeight = sheetHeight("peek", screenHeight);
  const maxHeight = sheetHeight("full", screenHeight);
  const height = dragHeight ?? sheetHeight(size, screenHeight);

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    const startY = event.clientY;
    const startHeight = height;
    let current = startHeight;
    let moved = false;

    function onMove(e: globalThis.PointerEvent) {
      const dy = startY - e.clientY; // dragging up makes it taller
      if (!moved && Math.abs(dy) <= 4) return; // a tiny wobble is still a tap
      moved = true;
      current = Math.min(maxHeight, Math.max(minHeight, startHeight + dy));
      setDragHeight(current);
    }

    function onUp() {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      if (!moved) return; // it was a tap; the handle's onClick deals with it
      // The browser may send a click right after a drag ends; it isn't a tap.
      // That click comes immediately, so the flag only needs to last a moment.
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false), 0);
      setDragHeight(null);
      onSize(closestSize(current, screenHeight)); // let go: snap to the closest size
    }

    // Listen on the whole window, so the drag keeps working even when the
    // finger or mouse moves off the top of the sheet.
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  function onTap() {
    if (justDragged.current) return;
    onSize(SHEET_SIZES[(SHEET_SIZES.indexOf(size) + 1) % SHEET_SIZES.length]);
  }

  return (
    <section
      className={`panel sheet${dragHeight !== null ? " sheet-dragging" : ""}`}
      style={{ height }}
      aria-labelledby={labelledBy}
    >
      <div className="sheet-grab" onPointerDown={onPointerDown}>
        <button
          type="button"
          className="sheet-handle"
          onClick={onTap}
          aria-label={t("sheet.handle", { size: t(`sheet.${size}`) })}
        >
          <span aria-hidden="true" />
        </button>
        {header}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}
