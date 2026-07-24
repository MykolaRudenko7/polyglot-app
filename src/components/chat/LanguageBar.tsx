import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { LANGUAGES } from "../../../shared/languages";

interface LanguageBarProps {
  lang: string;
  onSelect: (code: string) => void;
  disabledCode: string | null;
  onReset: () => void;
}

export function LanguageBar({ lang, onSelect, disabledCode, onReset }: LanguageBarProps) {
  return (
    <div className="flex items-center justify-center gap-2 border-t border-[#eee] px-3 pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
      {LANGUAGES.map(({ code, name, flag }) => {
        const active = code === lang;
        const disabled = code === disabledCode;
        return (
          <button
            key={code}
            type="button"
            onClick={() => onSelect(code)}
            disabled={disabled}
            aria-label={`Translate to ${name}`}
            aria-pressed={active}
            title={disabled ? `${name} (detected as input)` : name}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xl transition",
              active ? "border-blue bg-blue/10" : "border-transparent",
              disabled ? "cursor-not-allowed opacity-30" : "hover:bg-[#f2f2f2]"
            )}
          >
            <span aria-hidden="true">{flag}</span>
          </button>
        );
      })}
      <span className="mx-1 h-5 w-px bg-[#e2e2e2]" />
      <button
        type="button"
        onClick={onReset}
        aria-label="Clear chat"
        title="Clear chat"
        className="grid size-8 place-content-center rounded-full text-[#999] transition hover:bg-[#f2f2f2] hover:text-[#555]"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
