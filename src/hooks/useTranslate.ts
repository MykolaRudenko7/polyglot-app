import { useState } from "react";
import { requestTranslation } from "@/api/translateClient";

export type TranslateStatus = "idle" | "loading" | "done" | "error";

export interface UseTranslate {
  status: TranslateStatus;
  translation: string;
  error: string;
  run: (text: string, targetLang: string) => Promise<void>;
  reset: () => void;
}

export function useTranslate(): UseTranslate {
  const [status, setStatus] = useState<TranslateStatus>("idle");
  const [translation, setTranslation] = useState("");
  const [error, setError] = useState("");

  async function run(text: string, targetLang: string): Promise<void> {
    setStatus("loading");
    setError("");
    setTranslation("");

    try {
      const result = await requestTranslation(text, targetLang);
      setTranslation(result);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  function reset(): void {
    setStatus("idle");
    setTranslation("");
    setError("");
  }

  return { status, translation, error, run, reset };
}
