import * as React from 'react'
import { OptionalString } from '@digital-magic/ts-common-utils/lib/type'

export type HtmlMouseEventHandler = React.MouseEventHandler<HTMLElement>
export type HtmlMouseButtonEventHandler = React.MouseEventHandler<HTMLButtonElement>
export type HtmlSelectChangeEventHandler = React.ChangeEventHandler<HTMLSelectElement>
export type HtmlInputChangeEventHandler = React.ChangeEventHandler<HTMLInputElement>
export type HtmlInputFocusEventHandler = React.FocusEventHandler<HTMLInputElement>
export type HtmlFormSubmitEventHandler = React.FormEventHandler<HTMLFormElement>

/**
 * Type for params that useEffect hook receives.
 */
export type EffectHookParamsType = typeof React.useEffect

/**
 * Type that should be used to define element class name.
 */
export type ClassName = OptionalString

/**
 * Property type for component that has children property.
 */
export type PropWithChildren = {
  children?: React.ReactNode
}
