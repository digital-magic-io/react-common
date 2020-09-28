import React from 'react'

export type AuthContextType = {
  readonly authorized: boolean
}

export type AuthContext<T extends AuthContextType> = React.Context<T>

export type AuthContextProps = {
  readonly children: React.ReactNode
}
