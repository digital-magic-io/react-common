import * as React from 'react'
import { hasValue } from '@digital-magic/ts-common-utils'

/**
 * Form handle to be used as type for Ref object.
 */
// eslint-disable-next-line functional/readonly-type
export type FormHandle = {
  readonly doSubmit: () => void
}

/**
 * Modal dialog handle to be used as type for Ref object.
 */
// eslint-disable-next-line functional/readonly-type
export type ModalDialogHandle = {
  readonly show: () => void
  readonly hide: () => void
}

export const withRefObject =
  <T>(ref: React.RefObject<T>) =>
  (f: React.Dispatch<T>): void => {
    if (hasValue(ref.current)) {
      f(ref.current)
    } else {
      // TODO: Find a way how to avoid console interaction here
      // eslint-disable-next-line no-console,@typescript-eslint/restrict-template-expressions
      console.error(`Unable to call ref handler method because it has no value: ${ref.current}`)
    }
  }

/**
 * Submit a form using its Ref object.
 * @param ref form reference
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export const submitFormByRef = (ref: React.RefObject<FormHandle>) => withRefObject(ref)((h) => h.doSubmit())

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
) => React.MouseEventHandler<HTMLElement> = (ref, f) => (e) => {
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
) => React.MouseEventHandler<HTMLElement> = (ref, f) => (e) => {
  e.preventDefault()
  if (f !== undefined) {
    f()
  }
  hideDialog(ref)
}

export const useDialogRef = (): React.RefObject<ModalDialogHandle> => React.useRef(null)

export const useFormRef = (): React.RefObject<FormHandle> => React.useRef(null)
