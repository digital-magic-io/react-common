import React from 'react'
import { hasValue, isEmpty, OptionalString, OptionalType } from '@digital-magic/ts-common-utils/lib/type'
import { HtmlMouseEventHandler } from './events'
import { AppError } from './types'
import { TFunction } from 'i18next'
import { ErrorToMessageKey, i18nMapper } from './i18n'

/**
 * Type that should be used to define element class name.
 */
export type ClassName = OptionalString

/**
 * Classes that are used in menu items.
 */
export enum MenuClass {
  Active = 'active',
  Disabled = 'disabled'
}

/**
 * Common html element classes.
 */
export enum CommonClass {
  Active = 'active',
  Hidden = 'hidden',
  Disabled = 'disabled'
}

export const withRefObject = <T>(ref: React.RefObject<T>) => (f: React.Dispatch<T>): void => {
  if (hasValue(ref.current)) {
    f(ref.current)
  } else {
    // TODO: Find a way how to avoid console interaction here
    // tslint:disable-next-line:no-console
    console.error('Unable to call ref handler method because it has no value: ' + ref.current)
  }
}

/**
 * Form handle to be used as type for Ref object.
 */
export type FormHandle = {
  doSubmit(): void
}

/**
 * Submit a form using it's Ref object.
 * @param ref form reference
 */
export const submitFormByRef = (ref: React.RefObject<FormHandle>) => withRefObject(ref)((h) => h.doSubmit())

/**
 * Builds a handler that submits a form.
 * @param ref form reference
 */
export const handleWithSubmitForm: (ref: React.RefObject<FormHandle>) => HtmlMouseEventHandler = (ref) => (e) => {
  e.preventDefault()
  submitFormByRef(ref)
}

/**
 * Modal dialog handle to be used as type for Ref object.
 */
export type ModalDialogHandle = {
  show(): void
  hide(): void
}

/**
 * Show modal dialog using it's Ref object.
 * @param ref modal dialog reference
 */
export const showDialog = (ref: React.RefObject<ModalDialogHandle>): void =>
  withRefObject<ModalDialogHandle>(ref)((h) => h.show())

/**
 * Hide modal dialog using it's Ref object.
 * @param ref modal dialog reference
 */
export const hideDialog = (ref: React.RefObject<ModalDialogHandle>): void =>
  withRefObject<ModalDialogHandle>(ref)((h) => h.hide())

/**
 * Build a handler that shows modal dialog.
 * @param ref modal dialog reference
 * @param f initialize function (will be executed before dialog will be shown)
 */
export const handleWithShowDialog: (
  ref: React.RefObject<ModalDialogHandle>,
  f?: () => void
) => HtmlMouseEventHandler = (ref, f) => (e) => {
  e.preventDefault()
  if (f !== undefined) {
    f()
  }
  showDialog(ref)
}

/**
 * Build a handler that hides modal dialog.
 * @param ref modal dialog reference
 * @param f finalize function (will be executed before dialog will be hidden)
 */
export const handleWithHideDialog: (
  ref: React.RefObject<ModalDialogHandle>,
  f?: () => void
) => HtmlMouseEventHandler = (ref, f) => (e) => {
  e.preventDefault()
  if (f !== undefined) {
    f()
  }
  hideDialog(ref)
}

export type ErrorToMessage<T> = (err: AppError<T>) => string

export type ErrorHandler<T> = (
  err: OptionalType<AppError<T>>,
  operationName: () => string
) => React.DispatchWithoutAction

/**
 * Abstract Error Handler for API calls.
 */
export type AppErrorHandler<T> = (
  setError: React.Dispatch<React.SetStateAction<OptionalString>>,
  onError?: React.Dispatch<AppError<T>>
) => ErrorHandler<T>

export type FieldErrorHandler<T> = (
  fieldName: keyof T,
  setFieldValue: (fieldName: string, value: OptionalString) => void
) => ErrorHandler<T>

/**
 * Default implementation for Error Handler.
 * @param errToMsg function that converts error to user-friendly message.
 */
export const appErrorHandler: <T>(errToMsg: ErrorToMessage<T>) => AppErrorHandler<T> = (errToMsg) => (
  setError,
  onError
) => (err, operationName) => {
  return () => {
    if (hasValue(err)) {
      // TODO: Find a way to not use console here
      // tslint:disable-next-line:no-console
      console.error('Failed to complete ' + operationName(), err)
      if (hasValue(onError)) {
        onError(err)
      }
    }
    // TODO: Create map function for such cases on ts-common-utils
    setError(isEmpty(err) ? undefined : errToMsg(err))
  }
}

/**
 * Default implementation of error handler that uses translation.
 * @param t translation function
 * @param errToMsgKey function that converts error to user-friendly message.
 */
export const i18nAppErrorHandler: <T>(
  errToMsgKey: ErrorToMessageKey<T>
) => (t: TFunction) => AppErrorHandler<T> = i18nMapper(appErrorHandler)

/**
 * Default implementation for Error Handler that sets it's errors to certain field.
 * @param errToMsg function that converts error to user-friendly message.
 */
export const errorToFieldHandler: <T>(errToMsg: ErrorToMessage<T>) => FieldErrorHandler<T> = (errToMsg) => (
  fieldName,
  setFieldValue
) => (err, operationName) => {
  return () => {
    if (hasValue(err)) {
      // TODO: Find a way to not use console here
      // tslint:disable-next-line:no-console
      console.error('Failed to complete ' + operationName(), err)
    }
    // TODO: Create map function for such cases on ts-common-utils
    // TODO: Is there limitation for keyof to receive only string?
    setFieldValue(fieldName as string, isEmpty(err) ? undefined : errToMsg(err))
  }
}

/**
 * Default implementation of error handler that uses translation and sets it's errors to certain field.
 * @param t translation function
 * @param errToMsgKey function that converts error to user-friendly message.
 */
export const i18ErrorToFieldHandler: <T>(
  errToMsgKey: ErrorToMessageKey<T>
) => (t: TFunction) => FieldErrorHandler<T> = i18nMapper(errorToFieldHandler)
