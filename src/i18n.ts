import { AppError } from './types'
import { TFunction } from 'i18next'
import { ErrorToMessage } from './html'

/**
 * Function that converts AppError to message key from dictionary.
 */
export type ErrorToMessageKey<T> = (err: AppError<T>) => string

/**
 * Converts function that accepts translation info into function that converts AppError to string.
 * @param t tranlsation function
 * @param errToMsgKey function that converts error to user-friendly message.
 */
export const i18nAdapter: <T>(t: TFunction, errToMsgKey: ErrorToMessageKey<T>) => ErrorToMessage<T> = (
  t,
  errToMsgKey
) => (err) => t(errToMsgKey(err))

/**
 * Uses i18nAdapter to change function signature to use tranlsation.
 * @param f function that must receive ErrorToMessage and return result based on it
 */
export const i18nMapper = <T, R>(f: (errToMsg: ErrorToMessage<T>) => R) => (errToMsgKey: ErrorToMessageKey<T>) => (
  t: TFunction
): R => f(i18nAdapter(t, errToMsgKey))

/*
export const i18nErrorHandler: <T>(t: TFunction, errToMsgKey: ErrorToMessageKey<T>) => AppErrorHandler<T> = (
  t,
  errToMsgKey
) => appErrorHandler((err) => t(errToMsgKey(err)))
*/

/*
export const i18ErrorToFieldHandler: <T>(t: TFunction, errToMsgKey: ErrorToMessageKey<T>) => FieldErrorHandler<T> = (
  t,
  errToMsgKey
) => errorToFieldHandler((err) => t(errToMsgKey(err)))
*/
