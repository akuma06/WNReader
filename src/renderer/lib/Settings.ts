export type SaveSettings = {
  lang: string
  offline: boolean
}

export const defaultSettings: SaveSettings = {
  lang: 'en',
  offline: false
}

export function getSettings (): SaveSettings {
  const localSettings = localStorage.getItem('savedSettings') || '{}'
  return (localSettings !== null) ? Object.assign(defaultSettings, JSON.parse(localSettings)) : defaultSettings
}
