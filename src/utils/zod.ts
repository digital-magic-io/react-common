import * as z from 'zod'
import { hasValue } from '@digital-magic/ts-common-utils'

// type guard to check if value corresponds to zod schema
export const zodIs = <T extends z.ZodType<unknown>>(obj: unknown, schema: T): obj is z.infer<T> =>
  schema.safeParse(obj).success

export const zodUndefinedIfInvalid = <T extends z.ZodType<unknown>>(obj: unknown, schema: T): z.infer<T> | undefined =>
  zodIs(obj, schema) ? obj : undefined

// transform nullish date string to Date object | undefined
export const OptionalStringToDate: z.ZodEffects<z.ZodOptionalType<z.ZodNullable<z.ZodString>>, Date | undefined> = z
  .string()
  .nullish()
  .transform((d) => (d ? new Date(d) : undefined))
export type OptionalStringToDate = z.infer<typeof OptionalStringToDate>

// transform date string to Date object
export const StringToDate: z.ZodEffects<z.ZodString, Date> = z.string().transform((v) => new Date(v))
export type StringToDate = z.infer<typeof StringToDate>

export const BlobType = z
  .unknown()
  .refine((b) => b instanceof Blob)
  .transform((b) => b as Blob)
export type BlobType = z.infer<typeof BlobType>

// transform nullish (undefined or null) value to only undefined
export const NullishToOptional = <Schema extends z.ZodType<unknown>>(
  type: Schema
): z.ZodEffects<z.ZodType<z.infer<Schema> | null | undefined>, z.infer<Schema> | undefined> =>
  type.nullish().transform((v) => (hasValue(v) ? v : undefined))
