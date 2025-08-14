import { create } from 'zustand';

interface ConfirmState {
  message: string | null;
  resolve: ((value: boolean) => void) | null;
  show: (msg: string) => Promise<boolean>;
  hide: () => void;
}

export const useConfirmStore = create<ConfirmState>((set) => ({
  message: null,
  resolve: null,
  show: (msg) =>
    new Promise<boolean>((resolve) => {
      set({ message: msg, resolve });
    }),
  hide: () => set({ message: null, resolve: null }),
}));
