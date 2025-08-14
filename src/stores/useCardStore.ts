// src/stores/useCardStore.ts
import { create } from "zustand";
import type { Color } from "chess.js";

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
    description: "Bloqueas una casilla durante el turno del rival. Ninguna ficha puede ocupar esa casilla.",
    rarity: "normal",
    effectKey: "blockSquare",
  },
  {
    id: "bqr",
    name: "Boquete (raro)",
    description: "Bloqueas una casilla durante el turno del rival. Ninguna ficha puede caer ni pasar por encima",
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
    description: "Al lanzar esta carta robas otra que no es visible para el rival",
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

const rarityCounts: Record<Card["rarity"], number> = {

  normal: 6,
  rare: 5,
  epic: 4,
  mythic: 3,
  legendary: 2,
};

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function buildDeck(): Card[] {
  const byRarity: Record<Card["rarity"], Card[]> = {
    normal: [],
    rare: [],
    epic: [],
    mythic: [],
    legendary: [],
  };
  cardPool.forEach((c) => byRarity[c.rarity].push(c));
  const deck: Card[] = [];
  (Object.keys(rarityCounts) as Card["rarity"][]).forEach((rarity) => {
    const cards = byRarity[rarity];
    const needed = rarityCounts[rarity];
    if (cards.length === 0) return;
    for (let i = 0; i < needed; i++) {
      const template = cards[i % cards.length];
      deck.push({ ...template, id: `${template.id}-${i}` });
    }
  });
  return shuffle(deck);

}

interface CardState {
  deck: Card[];
  graveyard: Card[];
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
  reset: () => void;
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
      if (!state.hasFirstCapture || state.opponentHand.length >= 3)
        return {};
      if (state.deck.length === 0) return {};
      const [card, ...rest] = state.deck;
      return { opponentHand: [...state.opponentHand, card], deck: rest };

    }),

  drawHiddenCard: (player) =>
    set((state) => {
      if (state.deck.length === 0) return {};
      const [card, ...rest] = state.deck;
      const hiddenCard = { ...card, hidden: true };
      if (player === "w") {
        if (state.hand.length >= 3) return {};
        return { hand: [...state.hand, hiddenCard], deck: rest };
      } else {
        if (state.opponentHand.length >= 3) return {};
        return { opponentHand: [...state.opponentHand, hiddenCard], deck: rest };
      }
    }),

  discardCard: (id) =>
    set((state) => {
      const card =
        state.hand.find((c) => c.id === id) ||
        state.opponentHand.find((c) => c.id === id);
      return {
        hand: state.hand.filter((c) => c.id !== id),
        opponentHand: state.opponentHand.filter((c) => c.id !== id),
        selectedCard:
          state.selectedCard?.id === id ? null : state.selectedCard,
        graveyard: card ? [...state.graveyard, card] : state.graveyard,
      };
    }),

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
      graveyard: [...state.graveyard, ...state.opponentHand],
    })),

  reset: () =>
    set(() => ({
      deck: buildDeck(),
      graveyard: [],
      hand: [],
      opponentHand: [],
      initialFaceUp: null,
      hasFirstCapture: false,
      selectedCard: null,
    })),
}));
