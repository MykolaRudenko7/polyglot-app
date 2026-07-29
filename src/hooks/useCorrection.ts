import { useEffect, useState } from "react";
import { requestCorrection } from "@/api/apiClient";

const DEBOUNCE_MS = 900;
const MIN_LENGTH = 4;
const CACHE_LIMIT = 100;

const verdicts = new Map<string, string | null>();

function remember(text: string, verdict: string | null): void {
  if (verdicts.size >= CACHE_LIMIT) {
    const oldest = verdicts.keys().next().value;
    if (oldest !== undefined) verdicts.delete(oldest);
  }
  verdicts.set(text, verdict);
}

export function resetCorrectionCache(): void {
  verdicts.clear();
}

export function useCorrection(text: string): string | null {
  const [suggestion, setSuggestion] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = text.trim();

    if (trimmed.length < MIN_LENGTH) {
      setSuggestion(null);
      return;
    }

    if (verdicts.has(trimmed)) {
      setSuggestion(verdicts.get(trimmed) ?? null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      requestCorrection(trimmed)
        .then((corrected) => {
          const fixed = corrected.trim();
          const verdict = fixed && fixed !== trimmed ? fixed : null;

          remember(trimmed, verdict);
          // The correction is itself correct text, so accepting the suggestion
          // must not trigger a fresh round trip on the very next keystroke.
          if (verdict) remember(verdict, null);

          if (!cancelled) setSuggestion(verdict);
        })
        .catch(() => {
          // Deliberately not cached: a failure says nothing about the text, and
          // caching it would suppress corrections for the rest of the session.
          if (!cancelled) setSuggestion(null);
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [text]);

  return suggestion;
}
