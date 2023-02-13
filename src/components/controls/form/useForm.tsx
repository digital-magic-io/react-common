import * as z from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { FieldValues, SubmitHandler, useForm as useReactHookForm, UseFormProps, UseFormReturn } from 'react-hook-form'
import { createProxy, ObjPathProxy } from 'ts-object-path'
import { OptionalType } from '@digital-magic/ts-common-utils'
import { DeepRequired } from './types'

export type UseFormOptions<T extends FieldValues> = Readonly<Omit<UseFormProps<T>, 'resolver'>> &
  Readonly<{
    resolver: z.ZodType<T>
    errorMap: OptionalType<z.ZodErrorMap>
    onSubmit: SubmitHandler<T>
  }>

export type UseFormResult<T extends FieldValues> = UseFormReturn<T> &
  Readonly<{
    onSubmit: SubmitHandler<T>
    names: ObjPathProxy<DeepRequired<T>, DeepRequired<T>>
  }>

export const useForm = <T extends FieldValues>(opts: UseFormOptions<T>): UseFormResult<T> => {
  const names = createProxy<DeepRequired<T>>()

  const f = useReactHookForm<T>({
    mode: 'onChange',
    ...opts,
    resolver: zodResolver(opts.resolver, { errorMap: opts.errorMap })
  })

  return {
    ...f,
    onSubmit: opts.onSubmit,
    names
  }
}
