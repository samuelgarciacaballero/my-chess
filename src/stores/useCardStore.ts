// src/stores/useCardStore.ts
import { create } from "zustand";
import type { Color } from "chess.js";

export type Card = {
  id: string;
  name: string;
  description: string;
  rarity: "normal" | "rare" | "epic" | "mythic" | "legendary";
  effectKey: string;
};

const initialDeck: Card[] = [
  {
    id: "pm1",
    name: "Peón miedica",
    description: "Mover peón 1 casilla hacia atrás",
    rarity: "normal",
    effectKey: "pawnBackward1",
  },
  {
    id: "pm2",
    name: "Peón miedica (raro)",
    description: "Mover peón hacia atrás y comer en diagonal hacia atrás",
    rarity: "rare",
    effectKey: "pawnBackwardCapture",
  },
  {
    id: "pe1",
    name: "Peón escurridizo",
    description: "Mover peón lateral sin comer",
    rarity: "normal",
    effectKey: "pawnSideStep",
  },
  {
    id: "boquete",
    name: "Boquete",
    description: "Bloqueas una casilla rival durante su turno",
    rarity: "normal",
    effectKey: "blockSquare",
  },
  {
    id: "galope",
    name: "Galope Real",
    description: "La reina se mueve como caballo",
    rarity: "epic",
    effectKey: "queenKnightMove",
  },
  {
    id: "alfil-r",
    name: "Alfil racista",
    description: "Mover alfil hacia atrás y cambiar color de casilla",
    rarity: "normal",
    effectKey: "bishopReverseAndFlip",
  },
  {
    id: "alfil-z",
    name: "Alfil zoofílico",
    description: "Cambia un alfil por un caballo (mismo color)",
    rarity: "rare",
    effectKey: "bishopToKnight",
  },
  {
    id: "castillo",
    name: "Vuelta al castillo",
    description: "Enroque aunque rey haya movido o esté en jaque",
    rarity: "rare",
    effectKey: "kingFreeCastle",
  },
  {
    id: "paz",
    name: "Tratado de paz",
    description: "Durante el siguiente turno ninguno puede comer",
    rarity: "legendary",
    effectKey: "noCaptureNextTurn",
  },
  {
    id: "pasadizo",
    name: "Pasadizo real",
    description: "Mover rey 2 casillas sin comer",
    rarity: "normal",
    effectKey: "kingDoubleStep",
  },
  {
    id: "dejavu",
    name: "DEJAVÚ",
    description: "Retroceder al estado del turno anterior",
    rarity: "mythic",
    effectKey: "undoTurn",
  },
  {
    id: "cupido",
    name: "Cupido",
    description: "Alfil convierte un peón rival en tuyo por un turno",
    rarity: "epic",
    effectKey: "bishopCupid",
  },
];

interface CardState {
  deck: Card[];
  hand: Card[];
  opponentHand: Card[];
  initialFaceUp: Card | null;
  hasFirstCapture: boolean;
  selectedCard: Card | null;

  setInitialFaceUp: () => void;
  drawCard: () => void;
  drawOpponentCard: () => void;
  discardCard: (id: string) => void;
  markFirstCapture: (captorColor: Color) => void;
  selectCard: (id: string) => void;

  drawSpecificToHand: (id: string) => void;
  drawSpecificToOpponent: (id: string) => void;
  clearOpponentHand: () => void;
}

export const useCardStore = create<CardState>((set) => ({
  deck: initialDeck,
  hand: [],
  opponentHand: [],
  initialFaceUp: null,
  hasFirstCapture: false,
  selectedCard: null,

  setInitialFaceUp: () =>
    set((state) => ({
      initialFaceUp: state.deck[Math.floor(Math.random() * state.deck.length)],
    })),

  drawCard: () =>
    set((state) => {
      if (!state.hasFirstCapture || state.hand.length >= 3) return {};
      const available = state.deck.filter(
        (c) => !state.hand.includes(c) && c.id !== state.initialFaceUp?.id
      );
      if (available.length === 0) return {};
      const pick = available[Math.floor(Math.random() * available.length)];
      return { hand: [...state.hand, pick] };
    }),

  drawOpponentCard: () =>
    set((state) => {
      if (!state.hasFirstCapture || state.opponentHand.length >= 3) return {};
      const available = state.deck.filter(
        (c) => !state.hand.includes(c) && !state.opponentHand.includes(c)
      );
      if (available.length === 0) return {};
      const pick = available[Math.floor(Math.random() * available.length)];
      return { opponentHand: [...state.opponentHand, pick] };
    }),

  discardCard: (id) =>
    set((state) => ({
      hand: state.hand.filter((c) => c.id !== id),
    })),

  markFirstCapture: (captorColor) =>
    set((state) => {
      // Asignamos la carta inicial al captor correspondiente
      const card = state.initialFaceUp;
      if (!card) {
        return { hasFirstCapture: true, initialFaceUp: null };
      }
      if (captorColor === "w") {
        return {
          hasFirstCapture: true,
          hand: [card],
          initialFaceUp: null,
        };
      } else {
        return {
          hasFirstCapture: true,
          opponentHand: [card],
          initialFaceUp: null,
        };
      }
    }),

  selectCard: (id) =>
    set((state) => ({
      selectedCard:
        state.selectedCard?.id === id
          ? null
          : state.hand.find((c) => c.id === id) || null,
    })),

  drawSpecificToHand: (id) =>
    set((state) => {
      if (state.hand.length >= 3) return {};
      const card = state.deck.find((c) => c.id === id);
      return card ? { hand: [...state.hand, card] } : {};
    }),

  drawSpecificToOpponent: (id) =>
    set((state) => {
      if (state.opponentHand.length >= 3) return {};
      const card = state.deck.find((c) => c.id === id);
      return card ? { opponentHand: [...state.opponentHand, card] } : {};
    }),

  clearOpponentHand: () => set({ opponentHand: [] }),
}));
