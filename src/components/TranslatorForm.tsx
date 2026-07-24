import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { LANGUAGES } from "../../shared/languages";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface TranslatorFormProps {
  loading: boolean;
  onTranslate: (text: string, targetLang: string) => void;
}

export function TranslatorForm({ loading, onTranslate }: TranslatorFormProps) {
  const [text, setText] = useState("");
  const [lang, setLang] = useState(LANGUAGES[0].code);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!text.trim() || loading) return;
    onTranslate(text, lang);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
      <h2 className="text-blue text-center text-xl font-bold">Text to translate 👇</h2>
      <Textarea
        className="bg-field-bg focus-visible:ring-blue min-h-[100px] resize-y rounded-lg border-0 px-3.5 py-3 text-lg font-semibold text-[#333] shadow-none focus-visible:border-0 focus-visible:ring-2 md:text-lg"
        placeholder="How are you?"
        value={text}
        onChange={(event) => setText(event.target.value)}
      />

      <h2 className="text-blue text-center text-xl font-bold">Select language 👇</h2>
      <RadioGroup value={lang} onValueChange={setLang} className="gap-2.5 pl-4">
        {LANGUAGES.map(({ code, name, flag }) => (
          <div key={code} className="flex items-center gap-3">
            <RadioGroupItem id={`lang-${code}`} value={code} />
            <label
              htmlFor={`lang-${code}`}
              className="flex cursor-pointer items-center gap-2 text-xl font-bold text-[#333]"
            >
              {name}
              <span aria-hidden="true">{flag}</span>
            </label>
          </div>
        ))}
      </RadioGroup>

      <Button
        type="submit"
        disabled={loading || !text.trim()}
        className="bg-blue hover:bg-blue/90 mt-1 h-[50px] w-full rounded-md text-2xl font-bold text-white"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Translating…
          </>
        ) : (
          "Translate"
        )}
      </Button>
    </form>
  );
}
