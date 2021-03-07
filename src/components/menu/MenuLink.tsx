import * as React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HtmlMouseEventHandler } from '../../events'
import { MenuClass } from '../../html'

type Props = {
  readonly to?: string
  readonly className?: string
  readonly onClick?: HtmlMouseEventHandler
  readonly children: React.ReactNode
}

export const MenuLink: React.FC<Props> = ({ to, className, onClick, children }: Props) => {
  const location = useLocation()
  return (
    <li className={location.pathname === to ? MenuClass.Active : undefined}>
      {to === undefined ? (
        <a className={className} onClick={onClick} href="#">
          {children}
        </a>
      ) : (
        <Link className={className} to={to}>
          {children}
        </Link>
      )}
    </li>
  )
}
