import { create } from 'zustand';
import type { Span } from '../types';

interface DataState {
  data: Span[] | null;
  setData: (data: Span[] | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useDataStore = create<DataState>((set) => ({
  data: null,
  setData: (data) => set({ data }),
  error: null,
  setError: (error) => set({ error }),
}));
