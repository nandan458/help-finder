// "Use my location" button logic: asks the phone where it is and remembers
// whether it's working on it or what went wrong.

import { useCallback, useState } from "react";
import {
  getCurrentLocation,
  LocationError,
  type LocationErrorKind,
  type Origin,
} from "../lib/location";

export function useLocate(onFound: (origin: Origin) => void) {
  const [locating, setLocating] = useState(false);
  const [errorKind, setErrorKind] = useState<LocationErrorKind | null>(null);
  const [errorDetail, setErrorDetail] = useState(""); // the browser's own words, for bug reports

  const locate = useCallback(async () => {
    setLocating(true);
    setErrorKind(null);
    setErrorDetail("");
    try {
      const here = await getCurrentLocation();
      onFound({ ...here, source: "gps" });
    } catch (err) {
      setErrorKind(err instanceof LocationError ? err.kind : "unavailable");
      setErrorDetail(err instanceof LocationError ? err.detail : String(err));
    } finally {
      setLocating(false);
    }
  }, [onFound]);

  return { locate, locating, errorKind, errorDetail };
}
