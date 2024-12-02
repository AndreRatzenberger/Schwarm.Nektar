import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  endpointUrl: string;
  showRefreshButton: boolean;
  groupLogsByParent: boolean;
  showLogIndentation: boolean;
  isLoading: boolean;
  setEndpointUrl: (url: string) => void;
  setShowRefreshButton: (show: boolean) => void;
  setGroupLogsByParent: (group: boolean) => void;
  setShowLogIndentation: (show: boolean) => void;
  setIsLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      endpointUrl: "http://127.0.0.1:8123",
      showRefreshButton: true,  // Set to true by default since we need it for REST endpoints
      groupLogsByParent: true,
      showLogIndentation: true,
      isLoading: true,
      setEndpointUrl: (url) => set({ endpointUrl: url }),
      setShowRefreshButton: (show) => set({ showRefreshButton: show }),
      setGroupLogsByParent: (group) => set({ groupLogsByParent: group }),
      setShowLogIndentation: (show) => set({ showLogIndentation: show }),
      setIsLoading: (loading) => set({ isLoading: loading })
    }),
    {
      name: 'settings-storage'
    }
  )
);
