import { AxiosRequestConfig } from 'axios'

export const HttpHeader = {
  Accept: 'Accept',
  ContentType: 'Content-Type',
  Authorization: 'Authorization',
  XSessionId: 'X-SessionID'
}

export const ContentType = {
  JSON: 'application/json'
}

export const jsonHeaders: AxiosRequestConfig['headers'] = {
  [HttpHeader.Accept]: ContentType.JSON,
  [HttpHeader.ContentType]: ContentType.JSON
}
