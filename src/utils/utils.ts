import { DEFAULT_LANGUAGE_CODE, USER_LANGUAGE_CODE } from './global';

// TODO add deep merge util
export const getI18nForLang = <T extends Record<string, any>>(
  obj: T
): Partial<T[typeof DEFAULT_LANGUAGE_CODE]> => {
  return obj[USER_LANGUAGE_CODE] ?? obj[DEFAULT_LANGUAGE_CODE];
};
