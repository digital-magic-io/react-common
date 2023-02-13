import { NavLinkProps } from 'react-router-dom'
import { TFunction } from 'i18next'

export type MenuItemProps = {
  title: ReturnType<TFunction>
  to: NavLinkProps['to']
}
