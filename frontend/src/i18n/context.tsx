"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import en from "./translations/en.json";
import ms from "./translations/ms.json";

const translations = { en, ms } as const;

type Locale = "en" | "ms";
type Translations = typeof en;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => Promise<void>;
  setLocaleState: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: async () => {},
  setLocaleState: () => {},
  t: (key) => key,
});

function getNestedValue(obj: Translations, keyPath: string): string | undefined {
  const keys = keyPath.split(".");
  let current: unknown = obj;
  for (const k of keys) {
    if (current && typeof current === "object" && k in current) {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

function makeT(locale: Locale) {
  return (key: string, params?: Record<string, string | number>): string => {
    let value = getNestedValue(translations[locale], key);
    if (value === undefined) {
      value = getNestedValue(translations.en, key);
    }
    if (value === undefined) return key;

    if (params) {
      return Object.entries(params).reduce(
        (str, [k, v]) => str.replace(`{${k}}`, String(v)),
        value
      );
    }
    return value;
  };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  const setLocale = useCallback(async (newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      const { updateLanguage } = await import("@/hooks/useApi");
      await updateLanguage(newLocale);
    } catch {}
  }, []);

  const t = useCallback(makeT(locale), [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, setLocaleState, t }}>
      {children}
    </I18nContext.Provider>
  );
}

interface FullI18nContextType extends I18nContextType {
  setLocaleState: (l: Locale) => void;
}

export function useSessionLocaleSync() {
  const { setLocaleState } = useContext(I18nContext);
  return { setLocaleState };
}

export function useTranslation() {
  return useContext(I18nContext);
}
