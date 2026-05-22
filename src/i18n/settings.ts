export const fallbackLanguage = "en";

export const languages = [
  { code: "en", label: "English", nativeLabel: "English", flag: "🇬🇧" },
  { code: "sq", label: "Albanian", nativeLabel: "Shqip", flag: "🇦🇱" }
] as const;

export type AppLanguage = (typeof languages)[number]["code"];

export function isAppLanguage(value: string | undefined | null): value is AppLanguage {
  return languages.some((language) => language.code === value);
}
