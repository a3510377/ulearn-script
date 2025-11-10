import { DEFAULT_LANGUAGE_CODE, USER_LANGUAGE_CODE } from './global';

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
): Partial<T[typeof DEFAULT_LANGUAGE_CODE]> => {
  const userLang = obj[USER_LANGUAGE_CODE];
  const defaultLang = obj[DEFAULT_LANGUAGE_CODE];

  if (!userLang) return defaultLang;
  if (!defaultLang) return {};

  return deepMerge(defaultLang, userLang);
};
