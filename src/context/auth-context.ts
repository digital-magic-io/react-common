import React from 'react'
import { isNotEmptyString } from '@digital-magic/ts-common-utils/lib/type'

export type AuthContextType = {
  readonly authorized: boolean
}

export type AuthContext<T extends AuthContextType> = React.Context<T>

export type AuthContextProps = {
  readonly children: React.ReactNode
}

export const createAuthContext = <T extends AuthContextType>(defaultValue: T, displayName?: string): AuthContext<T> => {
  const ctx: AuthContext<T> = React.createContext<T>(defaultValue)
  if (isNotEmptyString(displayName)) {
    // eslint-disable-next-line functional/immutable-data
    ctx.displayName = displayName
  }
  return ctx
}
