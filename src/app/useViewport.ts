// Screen size, kept up to date when the phone rotates or the window resizes.
// "Phone" means narrower than 768 px, the same line App.css uses.

import { useEffect, useState } from "react";

const PHONE_QUERY = "(max-width: 767px)";

function read() {
  return { isPhone: window.matchMedia(PHONE_QUERY).matches, height: window.innerHeight };
}

export function useViewport() {
  const [viewport, setViewport] = useState(read);
  useEffect(() => {
    const update = () => setViewport(read());
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return viewport;
}
