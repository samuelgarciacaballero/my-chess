import { create } from "zustand";

interface SettingsState {
  /** Whether local two-player mode is enabled */
  localMultiplayer: boolean;
  /** Whether the history panel is visible */
  showHistory: boolean;
  /** Toggle local two-player mode */
  toggleLocalMultiplayer: () => void;
  /** Toggle visibility of the history panel */
  toggleHistory: () => void;

}

export const useSettingsStore = create<SettingsState>((set) => ({
  localMultiplayer: false,
  showHistory: true,
  toggleLocalMultiplayer: () =>
    set((s) => ({ localMultiplayer: !s.localMultiplayer })),
  toggleHistory: () => set((s) => ({ showHistory: !s.showHistory })),

}));

