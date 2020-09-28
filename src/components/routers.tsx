import React from 'react'
import { Route, Redirect } from 'react-router-dom'
import { AuthContext, AuthContextType } from '../context/auth-context'

export type Routes = {
  readonly index: string
  readonly login: string
}

// TODO: Remove these ts-ignore and introduce types for components' props

// @ts-ignore
const renderMergedProps = (component, ...rest) => React.createElement(component, Object.assign({}, ...rest))

export const PrivateRoute = <T extends AuthContextType>(routes: Routes, authContext: AuthContext<T>) => ({
  // @ts-ignore
  component,
  ...rest
}) => {
  const { authorized } = React.useContext(authContext)
  return (
    <Route
      {...rest}
      render={(props) =>
        authorized ? (
          renderMergedProps(component, props, rest)
        ) : (
          <Redirect to={{ pathname: routes.login, state: { from: props.location } }} />
        )
      }
    />
  )
}

export const PublicRoute = <T extends AuthContextType>(routes: Routes, authContext: AuthContext<T>) => ({
  // @ts-ignore
  component,
  ...rest
}) => {
  const { authorized } = React.useContext(authContext)
  return (
    <Route
      {...rest}
      render={(props) =>
        authorized ? (
          <Redirect to={{ pathname: routes.index, state: { from: props.location } }} />
        ) : (
          renderMergedProps(component, props, rest)
        )
      }
    />
  )
}
