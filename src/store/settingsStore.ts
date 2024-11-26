import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsState {
  endpointUrl: string
  refreshInterval: number | null
  showRefreshButton: boolean
  setEndpointUrl: (url: string) => void
  setRefreshInterval: (interval: number | null) => void
  setShowRefreshButton: (show: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      endpointUrl: 'http://127.0.0.1:8123',
      refreshInterval: 5000,
      showRefreshButton: true,
      setEndpointUrl: (url) => set({ endpointUrl: url }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      setShowRefreshButton: (show) => set({ showRefreshButton: show }),
    }),
    {
      name: 'agent-framework-settings',
    }
  )
)
