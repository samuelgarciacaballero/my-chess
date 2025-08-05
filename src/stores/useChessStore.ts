// src/stores/useChessStore.ts
import { create } from "zustand";
import { Chess } from "chess.js";
import type { Piece, Color, Square, Move } from "chess.js";
import { useCardStore } from "./useCardStore";

export interface LastMove {
  from: Square | null;
  to: Square | null;
}

export type SquarePiece = Piece | null;

interface ChessState {
  game: Chess;
  board: SquarePiece[][];
  turn: Color;
  lastMove: LastMove;
  blockedSquare: Square | null;
  blockedBy: Color | null;
  blockedType: "normal" | "rare" | null;
  move: (from: Square, to: Square, effectKey?: string) => boolean;
  blockSquareAt: (sq: Square) => void;
  reset: () => void;
}

export const useChessStore = create<ChessState>((set, get) => {
  const game = new Chess();

  const fileToCol = (f: string) => "abcdefgh".indexOf(f);
  const rankToRow = (r: number) => 8 - r;

  return {
    game,
    board: game.board() as SquarePiece[][],
    turn: game.turn(),
    lastMove: { from: null, to: null },
    blockedSquare: null,
    blockedBy: null,
    blockedType: null,

    move: (from, to, effectKey) => {
      // 0) Bloqueos
      const { blockedSquare, blockedType } = get();
      // No caer en casilla bloqueada
      if (to === blockedSquare) return false;
      // En boquete raro, no pasar por encima (salvo caballos)
      const pieceAtFrom = game.get(from as Square);
      if (
        blockedType === "rare" &&
        pieceAtFrom?.type !== "n" &&
        blockedSquare
      ) {
        const c1 = fileToCol(from[0]), r1 = rankToRow(+from[1]);
        const c2 = fileToCol(to[0]),   r2 = rankToRow(+to[1]);
        const dc = c2 - c1, dr = r2 - r1;
        const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
        const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
        let c = c1 + stepC, r = r1 + stepR;
        while (c !== c2 || r !== r2) {
          const sq = "abcdefgh"[c] + (8 - r).toString();
          if (sq === blockedSquare) return false;
          c += stepC; r += stepR;
        }
      }

      const cardStore = useCardStore.getState();
      const currentTurn = get().turn;

      // 1) Sólo mover si coincide turno
      const piece = game.get(from as Square);
      if (!piece || piece.color !== currentTurn) return false;

      // 2) Movimientos estándar
      const legal = game.moves({ verbose: true }) as Move[];
      let allowed = legal.some(m => m.from === from && m.to === to);

      const target = game.get(to as Square);
      let effectUsed = false, manual = false;
      let movedColor: Color;

      // 3) Reglas especiales por carta
      if (!allowed && effectKey) {
        const c1 = fileToCol(from[0]), r1 = rankToRow(+from[1]);
        const c2 = fileToCol(to[0]),   r2 = rankToRow(+to[1]);
        const dr = r2 - r1, dc = c2 - c1;

        switch (effectKey) {
          case "pawnBackward1":
            if (
              piece.type === "p" &&
              dc === 0 &&
              dr === (piece.color === "w" ? 1 : -1)
            ) {
              allowed = true; effectUsed = true; manual = true;
            }
            break;

          case "pawnBackwardCapture":
            if (
              piece.type === "p" &&
              Math.abs(dc) === 1 &&
              dr === (piece.color === "w" ? 1 : -1) &&
              target
            ) {
              allowed = true; effectUsed = true; manual = true;
            }
            break;

          case "pawnSideStep":
            if (
              piece.type === "p" &&
              dr === 0 &&
              Math.abs(dc) === 1 &&
              !target
            ) {
              allowed = true; effectUsed = true; manual = true;
            }
            break;

          case "blockSquare":
            if (!target) {
              allowed = true; effectUsed = true; manual = true;
              set({
                blockedSquare: to,
                blockedBy: currentTurn,
                blockedType: "normal"
              });
            }
            break;

          case "blockSquareRare":
            if (!target) {
              allowed = true; effectUsed = true; manual = true;
              set({
                blockedSquare: to,
                blockedBy: currentTurn,
                blockedType: "rare"
              });
            }
            break;

          case "queenKnightMove":
            if (piece.type === "q") {
              const drAbs = Math.abs(dr), dcAbs = Math.abs(dc);
              if (
                (drAbs === 2 && dcAbs === 1) ||
                (drAbs === 1 && dcAbs === 2)
              ) {
                allowed = true; effectUsed = true; manual = true;
              }
            }
            break;

          case "bishopReverseAndFlip":
            if (
              piece.type === "b" &&
              dc === 0 &&
              dr === (piece.color === "w" ? 1 : -1) &&
              !target
            ) {
              allowed = true; effectUsed = true; manual = true;
            }
            break;

          case "bishopToKnight":
            if (
              piece.type === "b" &&
              target?.type === "n" &&
              target.color === currentTurn
            ) {
              allowed = true; effectUsed = true; manual = true;
            }
            break;
        }
      }

      if (!allowed) return false;

      // 4) Ejecutar movimiento o bloqueo manual
      let resultCaptured: string | undefined;
      if (manual && effectUsed && piece) {
        if (effectKey === "bishopToKnight" && target) {
          // intercambio alfil ↔ caballo
          game.remove(from as Square);
          game.remove(to as Square);
          game.put({ type: "b", color: piece.color }, to as Square);
          game.put({ type: "n", color: piece.color }, from as Square);
          movedColor = piece.color;
        } else if (
          effectKey === "blockSquare" ||
          effectKey === "blockSquareRare"
        ) {
          // solo bloqueo, el turno ya se alternó en blockSquareAt
        } else {
          if (effectKey === "pawnBackwardCapture" && target) {
            game.remove(to as Square);
          }
          game.remove(from as Square);
          game.put({ type: piece.type, color: piece.color }, to as Square);
          movedColor = piece.color;
          resultCaptured = target?.type;
        }

        if (
          effectKey !== "blockSquare" &&
          effectKey !== "blockSquareRare"
        ) {
          const fenParts = game.fen().split(" ");
          fenParts[1] = movedColor === "w" ? "b" : "w";
          game.load(fenParts.join(" "));
        }
      } else {
        const m = game.move({ from, to });
        if (!m) return false;
        movedColor = m.color;
        resultCaptured = m.captured;
      }

      // 5) Primera captura
      if (resultCaptured && !cardStore.hasFirstCapture) {
        cardStore.markFirstCapture(movedColor);
        const nextTurn: Color = movedColor === "w" ? "b" : "w";
        set({
          board: game.board() as SquarePiece[][],
          turn: nextTurn,
          lastMove: { from, to },
        });
        return true;
      }

      // 6) Cambio normal de turno y limpia bloqueo si corresponde
      const nextTurn: Color = movedColor === "w" ? "b" : "w";
      if (nextTurn === get().blockedBy) {
        set({
          blockedSquare: null,
          blockedBy: null,
          blockedType: null
        });
      }
      set({
        board: game.board() as SquarePiece[][],
        turn: nextTurn,
        lastMove: { from, to },
      });

      // 7) Robar carta (si no fue bloqueo)
      if (
        !effectUsed ||
        (effectKey !== "blockSquare" && effectKey !== "blockSquareRare")
      ) {
        if (movedColor === "w") cardStore.drawCard();
        else cardStore.drawOpponentCard();
      }

      // 8) Descartar carta usada (si no fue bloqueo)
      if (
        effectUsed &&
        effectKey &&
        effectKey !== "blockSquare" &&
        effectKey !== "blockSquareRare"
      ) {
        const used = cardStore.hand.find(c => c.effectKey === effectKey);
        if (used) {
          cardStore.discardCard(used.id);
          cardStore.selectCard("");
        }
      }

      return true;
    },

    blockSquareAt: (sq: Square) => {
      const state = get();
      if (state.blockedSquare || state.game.get(sq)) return;
      const cardStore = useCardStore.getState();
      const selected = cardStore.selectedCard;
      if (!selected) return;

      const isRare = selected.effectKey === "blockSquareRare";
      const nextTurn: Color = state.turn === "w" ? "b" : "w";

      // alternar turno interno vía FEN
      const fenParts = state.game.fen().split(" ");
      fenParts[1] = nextTurn;
      state.game.load(fenParts.join(" "));

      // set de bloqueo
      set({
        blockedSquare: sq,
        blockedBy: state.turn,
        blockedType: isRare ? "rare" : "normal",
        turn: nextTurn,
        board: state.game.board() as SquarePiece[][]
      });

      // descartar carta y limpiar selección
      cardStore.discardCard(selected.id);
      cardStore.selectCard("");
    },

    reset: () => {
      const newGame = new Chess();
      set({
        game: newGame,
        board: newGame.board() as SquarePiece[][],
        turn: newGame.turn(),
        lastMove: { from: null, to: null },
        blockedSquare: null,
        blockedBy: null,
        blockedType: null
      });
    },
  };
});
