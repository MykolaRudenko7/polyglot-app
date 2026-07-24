import { useEffect, useRef, useState } from "react";
import { requestCorrection } from "@/api/apiClient";

const DEBOUNCE_MS = 900;
const MIN_LENGTH = 4;

export function useCorrection(text: string): string | null {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const lastCleanRef = useRef<string | null>(null);

  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed.length < MIN_LENGTH || trimmed === lastCleanRef.current) {
      setSuggestion(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      requestCorrection(trimmed)
        .then((corrected) => {
          if (cancelled) return;
          const fixed = corrected.trim();
          if (fixed && fixed !== trimmed) {
            lastCleanRef.current = fixed;
            setSuggestion(fixed);
          } else {
            lastCleanRef.current = trimmed;
            setSuggestion(null);
          }
        })
        .catch(() => {
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
