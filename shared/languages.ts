export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const LANGUAGES: readonly Language[] = [
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
];

export const LANGUAGE_NAMES: Record<string, string> = Object.fromEntries(
  LANGUAGES.map((language) => [language.code, language.name])
);
