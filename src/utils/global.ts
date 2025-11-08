export const SUPPORTED_LANGUAGE_CODES = ['zh-TW', 'zh-CN'] as const;

export const DEFAULT_LANGUAGE_CODE = 'zh-TW';

export const USER_LANGUAGE_CODE: LanguageCode = (() => {
  const lang = navigator.language || navigator.languages[0] || 'zh-TW';
  if (SUPPORTED_LANGUAGE_CODES.includes(lang as LanguageCode)) {
    return lang as LanguageCode;
  }

  if (lang.startsWith('zh')) {
    return 'zh-TW';
  }

  return DEFAULT_LANGUAGE_CODE;
})();

// 'en' | 'ja' | 'es' | 'fr' | 'de'
export type LanguageCode = (typeof SUPPORTED_LANGUAGE_CODES)[number];
