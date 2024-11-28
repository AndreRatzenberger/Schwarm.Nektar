import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  endpointUrl: string;
  refreshInterval: number | null;
  showRefreshButton: boolean;
  groupLogsByParent: boolean;
  showLogIndentation: boolean;
  setEndpointUrl: (url: string) => void;
  setRefreshInterval: (interval: number | null) => void;
  setShowRefreshButton: (show: boolean) => void;
  setGroupLogsByParent: (group: boolean) => void;
  setShowLogIndentation: (show: boolean) => void;
}

const getBackendUrl = () => {
  const { protocol, hostname, port } = window.location;


  // Production: Assume backend is hosted on the same domain
  return `${protocol}//${hostname}:${port}`;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      endpointUrl: getBackendUrl(),
      refreshInterval: 5000,
      showRefreshButton: false,
      groupLogsByParent: true,
      showLogIndentation: true,
      setEndpointUrl: (url) => set({ endpointUrl: url }),
      setRefreshInterval: (interval) => set({ refreshInterval: interval }),
      setShowRefreshButton: (show) => set({ showRefreshButton: show }),
      setGroupLogsByParent: (group) => set({ groupLogsByParent: group }),
      setShowLogIndentation: (show) => set({ showLogIndentation: show })
    }),
    {
      name: 'settings-storage'
    }
  )
);
