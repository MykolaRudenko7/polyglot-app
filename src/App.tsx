import { useState } from "react";
import { Header } from "@/components/Header";
import { TranslatorForm } from "@/components/TranslatorForm";
import { ResultView } from "@/components/ResultView";
import { useTranslate } from "@/hooks/useTranslate";

type Screen = "form" | "result";

export default function App() {
  const [screen, setScreen] = useState<Screen>("form");
  const [originalText, setOriginalText] = useState("");
  const { status, translation, error, run, reset } = useTranslate();

  function handleTranslate(text: string, targetLang: string) {
    setOriginalText(text);
    setScreen("result");
    void run(text, targetLang);
  }

  function handleStartOver() {
    reset();
    setOriginalText("");
    setScreen("form");
  }

  return (
    <div className="bg-page-bg flex min-h-dvh items-start justify-center px-4 py-6 sm:py-10">
      <main className="border-card-border w-full max-w-[400px] overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Header />
        <div className="px-5 pt-6 pb-8 sm:px-6">
          {screen === "form" ? (
            <TranslatorForm loading={status === "loading"} onTranslate={handleTranslate} />
          ) : (
            <ResultView
              originalText={originalText}
              translation={translation}
              loading={status === "loading"}
              error={status === "error" ? error : ""}
              onStartOver={handleStartOver}
            />
          )}
        </div>
      </main>
    </div>
  );
}
