import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  endpointUrl: string
  refreshInterval: number
  setEndpointUrl: (url: string) => void
  setRefreshInterval: (interval: number) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      endpointUrl: 'http://127.0.0.1:8123',
      refreshInterval: 5000,
      setEndpointUrl: (url) => set({ endpointUrl: url }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
    }),
    {
      name: 'agent-framework-settings',
    }
  )
)
