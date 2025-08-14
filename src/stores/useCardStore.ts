// src/stores/useCardStore.ts
import { create } from "zustand";
import type { Color } from "chess.js";
import { useChessStore } from "./useChessStore";

export type Card = {
  id: string;
  name: string;
  description: string;
  rarity: "normal" | "rare" | "epic" | "mythic" | "legendary";
  effectKey: string;
  hidden?: boolean;
};

const cardPool: Card[] = [
  {
    id: "pm1",
    name: "Peón miedica",
    description: "Mover peón 1 casilla hacia atrás",
    rarity: "normal",
    effectKey: "pawnBackward1",
  },
  {
    id: "pm2",
    name: "Retirada táctica",
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
    description:
      "Bloqueas una casilla durante el turno del rival. Ninguna ficha puede ocupar esa casilla.",
    rarity: "normal",
    effectKey: "blockSquare",
  },
  {
    id: "bqr",
    name: "Boquete (raro)",
    description:
      "Bloqueas una casilla durante el turno del rival. Ninguna ficha puede caer ni pasar por encima",
    rarity: "rare",
    effectKey: "blockSquareRare",
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
    name: "Impulso",
    description: "Mover alfil hacia atrás y cambiar color de casilla sin comer",
    rarity: "normal",
    effectKey: "bishopReverseAndFlip",
  },
  {
    id: "alfil-z",
    name: "Cambiazo",
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
    rarity: "legendary",
    effectKey: "undoTurn",
  },
  {
    id: "ocultas",
    name: "Artes Ocultas",
    description:
      "Al lanzar esta carta robas otra que no es visible para el rival",
    rarity: "mythic",
    effectKey: "hiddenDraw",
  },
  // {
  //   id: "cupido",
  //   name: "Cupido",
  //   description: "Alfil convierte un peón rival en tuyo por un turno",
  //   rarity: "epic",
  //   effectKey: "bishopCupid",
  // },
];

// Number of copies each card should have in the deck based on rarity
const rarityCopies: Record<Card["rarity"], number> = {
  normal: 4,
  rare: 3,
  epic: 2,
  legendary: 2,
  mythic: 1,
};

function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(array: T[], rng: () => number = Math.random): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildDeck(seed?: number): Card[] {
  const deck: Card[] = [];
  cardPool.forEach((c) => {
    const copies = rarityCopies[c.rarity];
    for (let i = 0; i < copies; i++) {
      deck.push({ ...c, id: `${c.id}-${i}` });
    }
  });
  return shuffle(deck, seed !== undefined ? mulberry32(seed) : Math.random);
}

export type GraveyardEntry = Card & { player: Color };

interface CardState {
  deck: Card[];
  graveyard: GraveyardEntry[];
  hand: Card[];
  opponentHand: Card[];
  initialFaceUp: Card | null;
  hasFirstCapture: boolean;
  selectedCard: Card | null;

  setInitialFaceUp: () => void;
  drawCard: () => void;
  drawOpponentCard: () => void;
  drawHiddenCard: (player: Color) => void;
  discardCard: (id: string) => void;
  markFirstCapture: (captorColor: Color) => void;
  selectCard: (id: string) => void;

  drawSpecificToHand: (id: string) => void;
  drawSpecificToOpponent: (id: string) => void;
  clearOpponentHand: () => void;
  reset: (seed?: number) => void;
}

export const useCardStore = create<CardState>((set) => ({
  deck: buildDeck(),

  graveyard: [],
  hand: [],
  opponentHand: [],
  initialFaceUp: null,
  hasFirstCapture: false,
  selectedCard: null,

  setInitialFaceUp: () =>
    set((state) => {
      if (state.deck.length === 0) return {};
      const [card, ...rest] = state.deck;
      return { initialFaceUp: card, deck: rest };
    }),

  drawCard: () =>
    set((state) => {
      if (!state.hasFirstCapture || state.hand.length >= 3) return {};
      if (state.deck.length === 0) return {};
      const [card, ...rest] = state.deck;
      return { hand: [...state.hand, card], deck: rest };
    }),

  drawOpponentCard: () =>
    set((state) => {
      if (!state.hasFirstCapture || state.opponentHand.length >= 3) return {};
      if (state.deck.length === 0) return {};
      const [card, ...rest] = state.deck;
      return { opponentHand: [...state.opponentHand, card], deck: rest };
    }),

  drawHiddenCard: (player) =>
    set((state) => {
      if (state.deck.length === 0) return {};
      const [card, ...rest] = state.deck;
      const hiddenCard = { ...card, hidden: true };
      const me = useChessStore.getState().playerColor;
      if (!me || player === me) {
        if (state.hand.length >= 3) return {};
        return { hand: [...state.hand, hiddenCard], deck: rest };
      } else {
        if (state.opponentHand.length >= 3) return {};
        return { opponentHand: [...state.opponentHand, hiddenCard], deck: rest };
      }
    }),

  discardCard: (id) =>
    set((state) => {
      const fromHand = state.hand.find((c) => c.id === id);
      const fromOpp = state.opponentHand.find((c) => c.id === id);
      const card = fromHand || fromOpp;
      const player: Color | undefined = fromHand
        ? "w"
        : fromOpp
          ? "b"
          : undefined;
      return {
        hand: state.hand.filter((c) => c.id !== id),
        opponentHand: state.opponentHand.filter((c) => c.id !== id),
        selectedCard: state.selectedCard?.id === id ? null : state.selectedCard,
        graveyard:
          card && player
            ? [...state.graveyard, { ...card, player }]
            : state.graveyard,
      };
    }),

  markFirstCapture: (captorColor) =>
    set((state) => {
      const card = state.initialFaceUp;
      if (!card) {
        return { hasFirstCapture: true, initialFaceUp: null };
      }
      const me = useChessStore.getState().playerColor;
      if (!me || captorColor === me) {
        return {
          hasFirstCapture: true,
          hand: [card],
          initialFaceUp: null,
        };
      }
      return {
        hasFirstCapture: true,
        opponentHand: [card],
        initialFaceUp: null,
      };
    }),

  selectCard: (id) =>
    set((state) => {
      if (state.selectedCard?.id === id) {
        return { selectedCard: null };
      }
      const fromHand = state.hand.find((c) => c.id === id);
      if (fromHand) return { selectedCard: fromHand };
      const fromOpp = state.opponentHand.find((c) => c.id === id);
      if (fromOpp) return { selectedCard: fromOpp };
      return { selectedCard: null };
    }),

  drawSpecificToHand: (id) =>
    set((state) => {
      if (state.hand.length >= 3) return {};
      const idx = state.deck.findIndex((c) => c.id === id);
      if (idx === -1) return {};
      const card = state.deck[idx];
      const deck = [...state.deck];
      deck.splice(idx, 1);
      return { hand: [...state.hand, card], deck };
    }),

  drawSpecificToOpponent: (id) =>
    set((state) => {
      if (state.opponentHand.length >= 3) return {};
      const idx = state.deck.findIndex((c) => c.id === id);
      if (idx === -1) return {};
      const card = state.deck[idx];
      const deck = [...state.deck];
      deck.splice(idx, 1);
      return { opponentHand: [...state.opponentHand, card], deck };
    }),

  clearOpponentHand: () =>
    set((state) => ({
      opponentHand: [],
      graveyard: [
        ...state.graveyard,
        ...state.opponentHand.map((c) => ({ ...c, player: "b" as Color })),
      ],
    })),

  reset: (seed?: number) =>
    set(() => ({
      deck: buildDeck(seed),
      graveyard: [],
      hand: [],
      opponentHand: [],
      initialFaceUp: null,
      hasFirstCapture: false,
      selectedCard: null,
    })),
}));
