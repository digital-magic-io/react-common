import * as z from 'zod'
import { ObjPathProxy, ObjProxyArg } from 'ts-object-path'
import { Primitive } from '@digital-magic/ts-common-utils'
import { FieldValues, UseFormReturn } from 'react-hook-form'

export type FormInputProps<T> = Readonly<{
  name: ObjProxyArg<T, T>
}>

// eslint-disable-next-line @typescript-eslint/ban-types
export type Builtin = Primitive | Function | Date | Error | RegExp

export type DeepRequired<T> = T extends Builtin
  ? NonNullable<T>
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<DeepRequired<K>, DeepRequired<V>>
  : T extends ReadonlyMap<infer K, infer V>
  ? ReadonlyMap<DeepRequired<K>, DeepRequired<V>>
  : T extends WeakMap<infer K, infer V>
  ? WeakMap<DeepRequired<K>, DeepRequired<V>>
  : T extends ReadonlySet<infer U>
  ? ReadonlySet<DeepRequired<U>>
  : T extends ReadonlySet<infer U>
  ? ReadonlySet<DeepRequired<U>>
  : T extends WeakSet<infer U>
  ? WeakSet<DeepRequired<U>>
  : T extends Promise<infer U>
  ? Promise<DeepRequired<U>>
  : // eslint-disable-next-line @typescript-eslint/ban-types
  T extends Readonly<{}>
  ? { readonly [K in keyof T]-?: DeepRequired<T[K]> }
  : NonNullable<T>

export type UseFormInputPropsResult = Readonly<{
  name: string
  error?: boolean
  helperText?: string
}>

export type UseFormContextResult<T extends FieldValues> = UseFormReturn<T> &
  Readonly<{
    names: ObjPathProxy<DeepRequired<T>, DeepRequired<T>>
  }>

export const FieldError = z.object({
  message: z.string()
})
export type FieldError = z.infer<typeof FieldError>
