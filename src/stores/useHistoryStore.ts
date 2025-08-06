import { create } from "zustand";
import type { Color, Square } from "chess.js";
import type { Card } from "./useCardStore";
import { useChessStore } from "./useChessStore";
import type { LastMove, SquarePiece } from "./useChessStore";

interface Snapshot {
  fen: string;
  lastMove: LastMove;
  blockedSquare: Square | null;
  blockedBy: Color | null;
  blockedType: "normal" | "rare" | null;
  skipCaptureFor: Color | null;
}

export type HistoryEvent =
  | { kind: "move"; color: Color; san: string; snapshot: Snapshot }
  | { kind: "card"; color: Color; card: Card; snapshot: Snapshot };

interface HistoryState {
  events: HistoryEvent[];
  currentIndex: number;
  viewIndex: number;
  addMove: (color: Color, san: string) => void;
  addCard: (color: Color, card: Card) => void;
  goTo: (idx: number) => void;
  backToCurrent: () => void;
  next: () => void;
  prev: () => void;
}

function createSnapshot(): Snapshot {
  const cs = useChessStore.getState();
  return {
    fen: cs.game.fen(),
    lastMove: cs.lastMove,
    blockedSquare: cs.blockedSquare,
    blockedBy: cs.blockedBy,
    blockedType: cs.blockedType,
    skipCaptureFor: cs.skipCaptureFor,
  };
}

function loadSnapshot(snap: Snapshot) {
  const cs = useChessStore.getState();
  cs.game.load(snap.fen);
  useChessStore.setState({
    board: cs.game.board() as SquarePiece[][],
    turn: cs.game.turn(),
    lastMove: snap.lastMove,
    blockedSquare: snap.blockedSquare,
    blockedBy: snap.blockedBy,
    blockedType: snap.blockedType,
    skipCaptureFor: snap.skipCaptureFor,
  });
}

export const useHistoryStore = create<HistoryState>((set, get) => ({
  events: [],
  currentIndex: -1,
  viewIndex: -1,
  addMove: (color, san) => {
    const snapshot = createSnapshot();
    set((state) => {
      const events = state.events
        .slice(0, state.currentIndex + 1)
        .concat({ kind: "move", color, san, snapshot });
      const idx = events.length - 1;
      return { events, currentIndex: idx, viewIndex: idx };
    });
  },
  addCard: (color, card) => {
    const snapshot = createSnapshot();
    set((state) => {
      const events = state.events
        .slice(0, state.currentIndex + 1)
        .concat({ kind: "card", color, card, snapshot });
      const idx = events.length - 1;
      return { events, currentIndex: idx, viewIndex: idx };
    });
  },
  goTo: (idx) => {
    const { events } = get();
    if (idx < 0 || idx >= events.length) return;
    loadSnapshot(events[idx].snapshot);
    set({ viewIndex: idx });
  },
  backToCurrent: () => {
    const { currentIndex } = get();
    if (currentIndex >= 0) get().goTo(currentIndex);
  },
  next: () => {
    const { viewIndex, events } = get();
    const idx = Math.min(events.length - 1, viewIndex + 1);
    get().goTo(idx);
  },
  prev: () => {
    const { viewIndex } = get();
    const idx = Math.max(0, viewIndex - 1);
    get().goTo(idx);
  },
}));
