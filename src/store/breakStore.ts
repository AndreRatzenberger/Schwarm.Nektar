import { create } from 'zustand'
import { useSettingsStore } from './settingsStore'

interface BreakState {
  isBreak: boolean
  setIsBreak: (isBreak: boolean) => void
  fetchBreakState: () => Promise<void>
  toggleBreak: () => Promise<void>
}

export const useBreakStore = create<BreakState>((set, get) => ({
  isBreak: false,
  setIsBreak: (isBreak) => set({ isBreak }),
  fetchBreakState: async () => {
    const { endpointUrl } = useSettingsStore.getState()
    try {
      const response = await fetch(`${endpointUrl}/break`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const isBreak = await response.json()
      set({ isBreak })
    } catch (error) {
      console.error('Failed to fetch break state:', error)
    }
  },
  toggleBreak: async () => {
    const { endpointUrl } = useSettingsStore.getState()
    
    try {
      const response = await fetch(`${endpointUrl}/break`, {
        method: 'POST',
        mode: 'cors',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'omit'
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      // After successful toggle, fetch the current state
      await get().fetchBreakState()
    } catch (error) {
      console.error('Failed to toggle break state:', error)
    }
  }
}))
