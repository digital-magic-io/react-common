import { TFunction } from 'i18next'

export type MenuLink = {
  readonly to: string
  readonly translation: (t: TFunction) => string
}

export const menuLink = (to: string, translation: (t: TFunction) => string): MenuLink => ({ to, translation })
