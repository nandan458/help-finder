// Read text out loud with the browser's built-in voice (the Web Speech API).
// It runs on the phone itself: no internet service, no account.

import { useCallback, useEffect, useState } from "react";

export const speechSupported = typeof window !== "undefined" && "speechSynthesis" in window;

export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    if (speechSupported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  /** Say `text`. `locale` (like "es-US") picks a voice that speaks that language. */
  const speak = useCallback((text: string, locale: string) => {
    if (!speechSupported) return;
    const synth = window.speechSynthesis;
    synth.cancel(); // stop anything already playing
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    // Prefer a voice for this exact language, like Spanish, if the phone has one.
    const language = locale.split("-")[0];
    utterance.voice =
      synth.getVoices().find((v) => v.lang === locale) ??
      synth.getVoices().find((v) => v.lang.startsWith(language)) ??
      null;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }, []);

  // Stop talking when the card closes.
  useEffect(() => stop, [stop]);

  return { speaking, speak, stop };
}
