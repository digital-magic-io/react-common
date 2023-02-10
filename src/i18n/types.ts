export type LanguageConfiguration = {
  translationNamespace: string
  loadPath: string
  version: string
  availableLanguages: Array<string>
  defaultLanguage: Array<string>
  storageKey: string
  cacheStorageKeyPrefix: string
  cacheExpirationMs: number
}
