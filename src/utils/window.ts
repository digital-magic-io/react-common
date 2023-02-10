import { hasValue, OptionalString } from '@digital-magic/ts-common-utils'

// Allow only string values in configuration to avoid any unsafe code execution
export const getWindowProperty = (name: string): OptionalString => {
  if (typeof window === 'undefined' || !Object.prototype.hasOwnProperty.call(window, name)) {
    return undefined
  }
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const prop: unknown = window[name]
  return hasValue(prop) && typeof prop === 'string' ? prop : undefined
}
