import { ChangeEventHandler, FocusEventHandler, MouseEventHandler } from 'react'

export type HtmlMouseEventHandler = MouseEventHandler<HTMLElement>
export type HtmlSelectChangeEventHandler = ChangeEventHandler<HTMLSelectElement>
export type HtmlInputChangeEventHandler = ChangeEventHandler<HTMLInputElement>
export type HtmlInputFocusEventHandler = FocusEventHandler<HTMLInputElement>
