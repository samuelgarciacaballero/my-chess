import { create } from "zustand";

interface SettingsState {
  /** Whether local two-player mode is enabled */
  localMultiplayer: boolean;
  /** Toggle local two-player mode */
  toggleLocalMultiplayer: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  localMultiplayer: false,
  toggleLocalMultiplayer: () =>
    set((s) => ({ localMultiplayer: !s.localMultiplayer })),
}));

