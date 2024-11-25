import { create } from 'zustand';
import { Log } from '../types';

interface LogState {
  logs: Log[];
  setLogs: (logs: Log[]) => void;
  addLogs: (logs: Log[]) => void;
  clearLogs: () => void;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  setLogs: (logs) => set({ logs }),
  addLogs: (logs) => set((state) => ({ logs: [...state.logs, ...logs] })),
  clearLogs: () => set({ logs: [] }),
}));
