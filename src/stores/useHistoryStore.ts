import { create } from 'zustand';

export interface HistoryState {
  events: unknown[];
  viewIndex: number;
  goTo: (index: number) => void;
  prev: () => void;
  next: () => void;
  backToCurrent: () => void;
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  events: [],
  viewIndex: 0,
  goTo: (index) => set({ viewIndex: index }),
  prev: () => set(state => ({ viewIndex: Math.max(0, state.viewIndex - 1) })),
  next: () => set(state => ({ viewIndex: Math.min(get().events.length - 1, state.viewIndex + 1) })),
  backToCurrent: () => set({ viewIndex: get().events.length - 1 }),
}));
