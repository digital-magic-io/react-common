/**
 * Common html element classes.
 */
export const elementClassName = {
  Hidden: 'hidden'
}
export type ElementClassName = typeof elementClassName

/**
 * Html control element classes.
 */
export const controlClassName = {
  ...elementClassName,
  Active: 'active',
  Disabled: 'disabled'
}
export type ControlClassName = typeof controlClassName
