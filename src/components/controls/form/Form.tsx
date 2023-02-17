import * as React from 'react'
import { FieldValues, FormProvider, SubmitErrorHandler, SubmitHandler, UseFormReturn } from 'react-hook-form'

export type FormProps<T extends FieldValues> = Omit<React.HTMLAttributes<HTMLFormElement>, 'onSubmit'> &
  React.PropsWithChildren &
  Readonly<{
    f: UseFormReturn<T> &
      Readonly<{
        onSubmit: SubmitHandler<T>
      }>
    onInvalid?: SubmitErrorHandler<T>
  }>

export const Form = <T extends FieldValues>({
  children,
  f,
  onInvalid,
  ...props
}: Readonly<FormProps<T>>): JSX.Element => {
  return (
    <FormProvider {...f}>
      <form {...props} onSubmit={f.handleSubmit(f.onSubmit, onInvalid)}>
        {children}
      </form>
    </FormProvider>
  )
}
