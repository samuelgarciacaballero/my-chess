import { create } from "zustand";

interface SettingsState {
  /** Whether local two-player mode is enabled */
  localMultiplayer: boolean;
  /** Toggle local two-player mode */
  toggleLocalMultiplayer: () => void;
  /** Whether full-view layout is enabled */
  fullView: boolean;
  /** Toggle full-view layout */
  toggleFullView: () => void;
  /** Whether layout is flipped for left-handed mode */
  leftHanded: boolean;
  /** Toggle left-handed layout */
  toggleLeftHanded: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  localMultiplayer: false,
  toggleLocalMultiplayer: () =>
    set((s) => ({ localMultiplayer: !s.localMultiplayer })),
  fullView: false,
  toggleFullView: () => set((s) => ({ fullView: !s.fullView })),
  leftHanded: false,
  toggleLeftHanded: () => set((s) => ({ leftHanded: !s.leftHanded })),
}));

