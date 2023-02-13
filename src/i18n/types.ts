export type LanguageConfiguration = {
  translationNamespace: string
  loadPath: string
  version: string
  availableLanguages: ReadonlyArray<string>
  defaultLanguage: ReadonlyArray<string>
  storageKey: string
  cacheStorageKeyPrefix: string
  cacheExpirationMs: number
}
