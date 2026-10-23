// A search box for typing a city or address. It only searches when the person
// presses Search (or Enter), never while typing, as Nominatim's rules ask.

import { useId, useState, type FormEvent } from "react";
import { useT } from "../i18n/useT";
import { geocode, GeocodeError, type GeocodeErrorKind } from "../lib/geocode";
import type { Origin } from "../lib/location";
import { UiIcon } from "./UiIcon";

type Props = {
  onFound: (origin: Origin) => void;
  autoFocus?: boolean;
};

export function PlaceSearch({ onFound, autoFocus }: Props) {
  const { t, lang } = useT();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorKind, setErrorKind] = useState<GeocodeErrorKind | null>(null);
  const inputId = useId();
  const errorId = useId();

  async function submit(event: FormEvent) {
    event.preventDefault(); // stop the browser from reloading the page
    if (!text.trim() || busy) return;
    setBusy(true);
    setErrorKind(null);
    try {
      const found = await geocode(text, lang);
      onFound({ lat: found.lat, lng: found.lng, label: found.label, source: "typed" });
    } catch (err) {
      setErrorKind(err instanceof GeocodeError ? err.kind : "server");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="place-search" role="search" onSubmit={submit}>
      <label htmlFor={inputId} className="visually-hidden">
        {t("placeSearch.label")}
      </label>
      <span className="search-field">
        <UiIcon name="search" />
        <input
          id={inputId}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder={t("placeSearch.placeholder")}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus={autoFocus}
          aria-invalid={errorKind ? true : undefined}
          aria-describedby={errorKind ? errorId : undefined}
        />
      </span>
      <button type="submit" className="button" disabled={busy}>
        {busy ? t("placeSearch.searching") : t("placeSearch.submit")}
      </button>
      {errorKind && (
        <p id={errorId} className="form-error" role="alert">
          {t(`geocode.${errorKind}`)}
        </p>
      )}
    </form>
  );
}
