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
  /** Si no-capture está activo: el color que no puede capturar */
  skipCaptureFor: Color | null;
  /** Mensaje de aviso temporal (o null si no hay) */
  notification: string | null;
  /** Limpia el mensaje de aviso */
  clearNotification: () => void;
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
    skipCaptureFor: null,
    notification: null,
    clearNotification: () => set({ notification: null }),

    move: (from, to, effectKey) => {
      const cardStore = useCardStore.getState();
      const currentTurn = get().turn;
      const piece = game.get(from as Square);
      if (!piece || piece.color !== currentTurn) return false;

      // 0) Tratado de paz: si está activo y se intenta capturar
      const targetPiece = game.get(to as Square);
      const skipFor = get().skipCaptureFor;
      if (skipFor === currentTurn && targetPiece) {
        set({
          notification: "No puedes comer este turno por el tratado de paz",
        });
        return false;
      }

      // 1) Bloqueos de casilla normal/rare
      const { blockedSquare, blockedType } = get();
      if (to === blockedSquare) {
        set({ notification: "En esta casilla hay un boquete" });
        return false;
      }
      if (blockedType === "rare" && piece.type !== "n" && blockedSquare) {
        const c1 = fileToCol(from[0]),
          r1 = rankToRow(+from[1]);
        const c2 = fileToCol(to[0]),
          r2 = rankToRow(+to[1]);
        const dc = c2 - c1,
          dr = r2 - r1;
        const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
        const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
        let c = c1 + stepC,
          r = r1 + stepR;
        while (c !== c2 || r !== r2) {
          const sq = "abcdefgh"[c] + (8 - r).toString();
          if (sq === blockedSquare) {
            set({
              notification: "En esta casilla hay un boquete infranqueable",
            });
            return false;
          }
          c += stepC;
          r += stepR;
        }
      }

      // 2) Tratado de paz: lanzamiento del efecto
      if (effectKey === "noCaptureNextTurn") {
        const legal = game.moves({ verbose: true }) as Move[];
        if (!legal.some((m) => m.from === from && m.to === to)) return false;
        const m = game.move({ from, to });
        if (!m) return false;
        const movedColor = m.color;
        // descartar carta
        const sel = cardStore.hand.find(
          (c) => c.effectKey === "noCaptureNextTurn"
        );
        if (sel) {
          cardStore.discardCard(sel.id);
          cardStore.selectCard("");
        }
        // activar skipCapture para el rival
        const opponent = movedColor === "w" ? "b" : "w";
        set({
          board: game.board() as SquarePiece[][],
          turn: opponent,
          lastMove: { from, to },
          skipCaptureFor: opponent,
        });
        return true;
      }

      // 3) Movimientos legales y otros efectos
      const legalMoves = game.moves({ verbose: true }) as Move[];
      let allowed = legalMoves.some((m) => m.from === from && m.to === to);
      let manual = false;
      let effectUsed = false;
      let movedColor: Color = currentTurn;
      let resultCaptured: string | undefined;

      if (!allowed && effectKey) {
        const c1 = fileToCol(from[0]),
          r1 = rankToRow(+from[1]);
        const c2 = fileToCol(to[0]),
          r2 = rankToRow(+to[1]);
        const dr = r2 - r1,
          dc = c2 - c1;
        switch (effectKey) {
          case "pawnBackward1":
            if (
              piece.type === "p" &&
              dc === 0 &&
              dr === (piece.color === "w" ? 1 : -1)
            ) {
              allowed = effectUsed = manual = true;
            }
            break;
          case "pawnBackwardCapture":
            if (
              piece.type === "p" &&
              Math.abs(dc) === 1 &&
              dr === (piece.color === "w" ? 1 : -1) &&
              targetPiece
            ) {
              allowed = effectUsed = manual = true;
            }
            break;
          case "pawnSideStep":
            if (
              piece.type === "p" &&
              dr === 0 &&
              Math.abs(dc) === 1 &&
              !targetPiece
            ) {
              allowed = effectUsed = manual = true;
            }
            break;
          case "blockSquare":
            if (!targetPiece) {
              allowed = effectUsed = manual = true;
              set({
                blockedSquare: to,
                blockedBy: currentTurn,
                blockedType: "normal",
              });
            }
            break;
          case "blockSquareRare":
            if (!targetPiece) {
              allowed = effectUsed = manual = true;
              set({
                blockedSquare: to,
                blockedBy: currentTurn,
                blockedType: "rare",
              });
            }
            break;
          case "queenKnightMove":
            if (piece.type === "q") {
              const da = Math.abs(dr),
                db = Math.abs(dc);
              if ((da === 2 && db === 1) || (da === 1 && db === 2)) {
                allowed = effectUsed = manual = true;
              }
            }
            break;
          case "bishopReverseAndFlip":
            if (
              piece.type === "b" &&
              dc === 0 &&
              dr === (piece.color === "w" ? 1 : -1) &&
              !targetPiece
            ) {
              allowed = effectUsed = manual = true;
            }
            break;
          case "bishopToKnight":
            if (
              piece.type === "b" &&
              targetPiece?.type === "n" &&
              targetPiece.color === currentTurn
            ) {
              allowed = effectUsed = manual = true;
            }
            break;
        }
      }

      if (!allowed) return false;

      // 4) Ejecutar movimiento o efecto manual
      if (manual && effectUsed) {
        if (effectKey !== "noCaptureNextTurn") {
          if (effectKey === "pawnBackwardCapture" && targetPiece) {
            game.remove(to as Square);
          }
          game.remove(from as Square);
          game.put({ type: piece.type, color: piece.color }, to as Square);
          movedColor = piece.color;
          resultCaptured = targetPiece?.type;
          // flip interno del turno
          const f = game.fen().split(" ");
          f[1] = movedColor === "w" ? "b" : "w";
          game.load(f.join(" "));
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
        const next = movedColor === "w" ? "b" : "w";
        set({
          board: game.board() as SquarePiece[][],
          turn: next,
          lastMove: { from, to },
        });
        return true;
      }

      // 6) Cambio de turno, limpieza de skipCapture y de boquete tras el turno rival
      const prevSkip = get().skipCaptureFor;
      const nextTurn = movedColor === "w" ? "b" : "w";
      const update: Partial<ChessState> = {
        board: game.board() as SquarePiece[][],
        turn: nextTurn,
        lastMove: { from, to },
      };
      // Si había un boquete y quien acaba de mover NO es quien lo puso, lo limpiamos
      if (
        get().blockedSquare &&
        get().blockedBy &&
        get().blockedBy !== movedColor
      ) {
        update.blockedSquare = null;
        update.blockedBy = null;
        update.blockedType = null;
      }
      if (prevSkip === currentTurn) {
        update.skipCaptureFor = null;
      }
      set(update);

      // 7) Robar carta si no fue bloqueo
      if (
        !(
          effectUsed &&
          (effectKey === "blockSquare" || effectKey === "blockSquareRare")
        )
      ) {
        if (movedColor === "w") cardStore.drawCard();
        else cardStore.drawOpponentCard();
      }

      // 8) Descartar carta usada
      if (
        effectUsed &&
        effectKey &&
        effectKey !== "blockSquare" &&
        effectKey !== "blockSquareRare" &&
        effectKey !== "noCaptureNextTurn"
      ) {
        const used = cardStore.hand.find((c) => c.effectKey === effectKey);
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
      const sel = cardStore.selectedCard;
      if (!sel) return;
      const isRare = sel.effectKey === "blockSquareRare";
      const next = state.turn === "w" ? "b" : "w";
      const f = state.game.fen().split(" ");
      f[1] = next;
      state.game.load(f.join(" "));
      set({
        blockedSquare: sq,
        blockedBy: state.turn,
        blockedType: isRare ? "rare" : "normal",
        turn: next,
        board: state.game.board() as SquarePiece[][],
        skipCaptureFor: state.skipCaptureFor,
      });
      cardStore.discardCard(sel.id);
      cardStore.selectCard("");
    },

    reset: () => {
      const ng = new Chess();
      set({
        game: ng,
        board: ng.board() as SquarePiece[][],
        turn: ng.turn(),
        lastMove: { from: null, to: null },
        blockedSquare: null,
        blockedBy: null,
        blockedType: null,
        skipCaptureFor: null,
        notification: null,
      });
    },
  };
});
