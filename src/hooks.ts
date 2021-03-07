import * as React from 'react'
import { hasValue, OptionalString, OptionalType } from '@digital-magic/ts-common-utils/lib/type'
import { appErrorHandler, errorToFieldHandler, ErrorToMessage, FormHandle, ModalDialogHandle } from './html'
import { AppError } from './types'
import { TFunction } from 'i18next'
import { ErrorToMessageKey, i18nMapper } from './i18n'

/**
 * Type for params that useEffect hook receives.
 */
type EffectHookParamsType = readonly [React.EffectCallback, React.DependencyList]

export const useDialogRef = (): React.RefObject<ModalDialogHandle> => React.useRef(null)
export const useFormRef = (): React.RefObject<FormHandle> => React.useRef(null)

export const successResponseEffect = <T>(handler: React.Dispatch<T>) => (
  response: OptionalType<T>
): EffectHookParamsType => [
  () => {
    if (hasValue(response)) {
      handler(response)
    }
  },
  [response]
]

export const successResponseHandleEffect = <T>(
  response: OptionalType<T>,
  handler: React.Dispatch<T>
): EffectHookParamsType => successResponseEffect(handler)(response)

export const successResponseToStateEffect = <T, E>(setState: React.Dispatch<E>) => (
  response: OptionalType<T>,
  convertor: (v: T) => E
): EffectHookParamsType =>
  successResponseHandleEffect(response, (r) => {
    setState(convertor(r))
  })

export type ErrorEffect<T> = (err: OptionalType<AppError<T>>, operationName: () => string) => EffectHookParamsType

export type AppErrorEffect<T> = (
  setError: React.Dispatch<React.SetStateAction<OptionalString>>,
  onError?: React.Dispatch<AppError<T>>
) => ErrorEffect<T>

export type FieldErrorEffect<E> = <T>(
  fieldName: keyof T,
  setFieldValue: (fieldName: string, value: OptionalString) => void
) => ErrorEffect<E>

export const appErrorEffect: <T>(errToMsg: ErrorToMessage<T>) => AppErrorEffect<T> = (errToMsg) => (
  setError,
  onError
) => (err, operationName) => [appErrorHandler(errToMsg)(setError, onError)(err, operationName), [err]]

export const i18nAppErrorEffect: <T>(
  errToMsgKey: ErrorToMessageKey<T>
) => (t: TFunction) => AppErrorEffect<T> = i18nMapper(appErrorEffect)

export const errorToFieldEffect: <T>(errToMsg: ErrorToMessage<T>) => FieldErrorEffect<T> = (errToMsg) => (
  fieldName,
  setFieldValue
) => (err, operationName) => [errorToFieldHandler(errToMsg)(fieldName, setFieldValue)(err, operationName), [err]]

export const i18nErrorToFieldEffect: <T>(
  errToMsgKey: ErrorToMessageKey<T>
) => (t: TFunction) => FieldErrorEffect<T> = i18nMapper(errorToFieldEffect)

/*
export const isLoadingEffect = (setLoading: Dispatch<boolean>) => (...loadingStates: boolean[]): [EffectCallback, DependencyList] => {
  return [
    () => {
      setLoading(fold(monoidAny)(loadingStates))
    },
    loadingStates
  ]
}
*/
