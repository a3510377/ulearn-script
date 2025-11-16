// All TronClass supported language codes, but not all are fully translated yet
export const SUPPORTED_LANGUAGE_CODES = [
  'zh-TW',
  'zh-CN',
  'zh-MO',
  'en-US',
  'en-GB',
  'th-TH',
  'id-ID',
  'ms-MY',
  'vi-VN',
] as const;

export const DEFAULT_LANGUAGE_CODE = 'zh-TW';

export const USER_LANGUAGE_CODE: LanguageCode = (() => {
  const lang = navigator.language || navigator.languages[0] || 'zh-TW';
  if (SUPPORTED_LANGUAGE_CODES.includes(lang as LanguageCode)) {
    return lang as LanguageCode;
  }

  if (lang.startsWith('zh')) return 'zh-TW';

  return DEFAULT_LANGUAGE_CODE;
})();

// 'en' | 'ja' | 'es' | 'fr' | 'de'
export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];

export const deepMerge = <
  T extends Record<string, any>,
  O extends Record<string, any> = Partial<T>
>(
  base: T,
  override: O
): T => {
  const result: T = { ...base };
  for (const key in override) {
    const value = override[key];
    if (
      value && // check for null/undefined
      typeof value === 'object' &&
      !Array.isArray(value) &&
      typeof base[key] === 'object' &&
      !Array.isArray(base[key])
    ) {
      result[key] = deepMerge(base[key], value);
    } else if (value !== undefined) {
      result[key] = value as T[typeof key];
    }
  }
  return result;
};

export const getI18nForLang = <T extends Record<string, any>>(
  obj: T
): T[typeof DEFAULT_LANGUAGE_CODE] => {
  const userLang = obj[USER_LANGUAGE_CODE];
  const defaultLang = obj[DEFAULT_LANGUAGE_CODE];

  if (!userLang) return defaultLang;

  return deepMerge(defaultLang, userLang);
};
