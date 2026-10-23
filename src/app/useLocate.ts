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

  const locate = useCallback(async () => {
    setLocating(true);
    setErrorKind(null);
    try {
      const here = await getCurrentLocation();
      onFound({ ...here, source: "gps" });
    } catch (err) {
      setErrorKind(err instanceof LocationError ? err.kind : "unavailable");
    } finally {
      setLocating(false);
    }
  }, [onFound]);

  return { locate, locating, errorKind };
}
