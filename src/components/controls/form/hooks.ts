import * as z from 'zod'
import { FieldValues, get, useFormContext as useNativeFormContext } from 'react-hook-form'
import { createProxy, getPath } from 'ts-object-path'
import { hasValue } from '@digital-magic/ts-common-utils'
import { DeepRequired, FieldError, FormInputProps, UseFormContextResult, UseFormInputPropsResult } from './types'
import { zodIs } from '../../../utils/zod'
import { propertyKeysToPath } from './utils'

export const useFormContext = <T extends FieldValues>(): UseFormContextResult<T> => ({
  ...useNativeFormContext<T>(),
  names: createProxy<DeepRequired<T>>()
})

export const useFormErrorMessage = (name: string): string | undefined => {
  const f = useNativeFormContext()

  // eslint-disable-next-line functional/no-let
  let err: unknown = get(f.formState.errors, name)

  if (zodIs(err, z.record(FieldError))) {
    const key = Object.keys(err)[0]
    err = err[key]
  }

  return zodIs(err, FieldError) ? err.message : undefined
}

export const useFormInputProps = <T>(props: FormInputProps<T>): UseFormInputPropsResult => {
  const name = propertyKeysToPath(getPath(props.name))
  const error = useFormErrorMessage(name)

  return {
    name,
    error: hasValue(error),
    helperText: error
  }
}
