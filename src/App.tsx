import { useState } from "react";
import { Header } from "@/components/Header";
import { TranslatorForm } from "@/components/TranslatorForm";
import { ResultView } from "@/components/ResultView";
import { useTranslate } from "@/hooks/useTranslate";
import { detectLanguageCode } from "@/lib/detectLanguage";
import { LANGUAGES } from "../shared/languages";

type Screen = "form" | "result";

const DEFAULT_LANG = LANGUAGES[0].code;

export default function App() {
  const [screen, setScreen] = useState<Screen>("form");
  const [text, setText] = useState("");
  const [lang, setLang] = useState(DEFAULT_LANG);
  const { status, translation, error, run, reset } = useTranslate();

  const detectedCode = detectLanguageCode(text);

  function handleTextChange(value: string) {
    setText(value);
    const detected = detectLanguageCode(value);
    if (detected && detected === lang) {
      const fallback = LANGUAGES.find((language) => language.code !== detected);
      if (fallback) setLang(fallback.code);
    }
  }

  function handleTranslate() {
    if (!text.trim()) return;
    setScreen("result");
    void run(text, lang);
  }

  function handleTryAgain() {
    reset();
    setScreen("form");
  }

  function handleStartOver() {
    reset();
    setText("");
    setLang(DEFAULT_LANG);
    setScreen("form");
  }

  return (
    <div className="bg-page-bg flex min-h-dvh items-start justify-center px-4 py-6 sm:py-10">
      <main className="border-card-border w-full max-w-[400px] overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Header />
        <div className="px-5 pt-6 pb-8 sm:px-6">
          {screen === "form" ? (
            <TranslatorForm
              text={text}
              onTextChange={handleTextChange}
              lang={lang}
              onLangChange={setLang}
              disabledCode={detectedCode}
              loading={status === "loading"}
              onSubmit={handleTranslate}
            />
          ) : (
            <ResultView
              originalText={text}
              translation={translation}
              loading={status === "loading"}
              error={status === "error" ? error : ""}
              onStartOver={handleStartOver}
              onTryAgain={handleTryAgain}
            />
          )}
        </div>
      </main>
    </div>
  );
}
