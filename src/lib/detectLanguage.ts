import { franc } from "franc-min";

const ISO_TO_CODE: Record<string, string> = {
  eng: "en",
  fra: "fr",
  spa: "es",
  ukr: "uk",
  jpn: "ja",
};

export function detectLanguageCode(text: string): string | null {
  const trimmed = text.trim();
  if (trimmed.length < 2) return null;
  if (/[぀-ヿ]/.test(trimmed)) return "ja";
  if (/[іїєґ]/i.test(trimmed)) return "uk";
  const iso = franc(trimmed, { minLength: 3 });
  return ISO_TO_CODE[iso] ?? null;
}
