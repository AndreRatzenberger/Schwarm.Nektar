import { create } from 'zustand';
import type { Span } from '../types';

interface DataState {
  endpoint: string;
  refreshInterval: number;
  setEndpoint: (endpoint: string) => void;
  setRefreshInterval: (interval: number) => void;
  data: Span[] | null;
  setData: (data: Span[] | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useDataStore = create<DataState>((set) => ({
  endpoint: 'http://127.0.0.1:8123/spans',
  refreshInterval: 5000,
  setEndpoint: (endpoint) => set({ endpoint }),
  setRefreshInterval: (refreshInterval) => set({ refreshInterval }),
  data: null,
  setData: (data) => set({ data }),
  error: null,
  setError: (error) => set({ error }),
}));
