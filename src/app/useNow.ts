// The current time, updated every minute, so "Open" changes to "Closes soon"
// on its own while the app is open.

import { useEffect, useState } from "react";

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);
  return now;
}
