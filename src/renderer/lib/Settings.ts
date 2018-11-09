export type SaveSettings = {
  lang: string
}

export const defaultSettings: SaveSettings = {
  lang: 'en'
}

export function getSettings (): SaveSettings {
  const localSettings = localStorage.getItem('savedSettings') || '{}'
  return (localSettings !== null) ? Object.assign(defaultSettings, JSON.parse(localSettings)) : defaultSettings
}
