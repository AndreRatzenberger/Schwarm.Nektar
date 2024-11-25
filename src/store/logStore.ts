import { create } from 'zustand';
import type { Log } from '../types';

interface LogState {
  logs: Log[];
  latestId: string | null;
  setLogs: (logs: Log[]) => void;
  appendLogs: (newLogs: Log[]) => void;
  setLatestId: (id: string) => void;
  reset: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  latestId: null,
  setLogs: (logs) => set({ 
    logs,
    latestId: logs.length > 0 ? logs[logs.length - 1].id : null
  }),
  appendLogs: (newLogs) => set((state) => ({ 
    logs: [...state.logs, ...newLogs],
    latestId: newLogs.length > 0 ? newLogs[newLogs.length - 1].id : state.latestId
  })),
  setLatestId: (id) => set({ latestId: id }),
  reset: () => set({ logs: [], latestId: null })
}));