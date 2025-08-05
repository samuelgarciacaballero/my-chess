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

      // 0) Tratado de paz: bloquea capturas si corresponde
      const targetPiece = game.get(to as Square);
      const skipFor = get().skipCaptureFor;
      if (skipFor === currentTurn && targetPiece) {
        set({ notification: "No puedes comer este turno por el tratado de paz" });
        return false;
      }

      // 1) Bloqueos de casilla
      const { blockedSquare, blockedType } = get();
      if (to === blockedSquare) {
        set({ notification: "En esta casilla hay un boquete" });
        return false;
      }
      if (blockedType === "rare" && piece.type !== "n" && blockedSquare) {
        const c1 = fileToCol(from[0]), r1 = rankToRow(+from[1]);
        const c2 = fileToCol(to[0]), r2 = rankToRow(+to[1]);
        const dc = c2 - c1, dr = r2 - r1;
        const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
        const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
        let c = c1 + stepC, r = r1 + stepR;
        while (c !== c2 || r !== r2) {
          const sq = "abcdefgh"[c] + (8 - r);
          if (sq === blockedSquare) {
            set({ notification: "En esta casilla hay un boquete infranqueable" });
            return false;
          }
          c += stepC;
          r += stepR;
        }
      }

      // 2) Efecto kingFreeCastle: restaurar derechos y permitir enroque manual
      if (effectKey === "kingFreeCastle" && piece.type === "k") {
        const home: Square = piece.color === "w" ? "e1" : "e8";
        if (to === home) {
          game.remove(from as Square);
          game.put({ type: "k", color: piece.color }, home);
          const fenParts = game.fen().split(" ");
          fenParts[2] = piece.color === "w" ? "KQ" : "kq";
          fenParts[1] = currentTurn;
          game.load(fenParts.join(" "));
          const sel = cardStore.hand.find((c) => c.effectKey === "kingFreeCastle");
          if (sel) { cardStore.discardCard(sel.id); cardStore.selectCard(""); }
          set({ board: game.board() as SquarePiece[][], turn: currentTurn, lastMove: { from, to: home } });
          return true;
        }
        return false;
      }

      // 3) Efecto noCaptureNextTurn
      if (effectKey === "noCaptureNextTurn") {
        const legal = game.moves({ verbose: true }) as Move[];
        if (!legal.some((m) => m.from === from && m.to === to)) return false;
        const m = game.move({ from, to });
        if (!m) return false;
        const movedColor = m.color;
        const sel = cardStore.hand.find((c) => c.effectKey === "noCaptureNextTurn");
        if (sel) { cardStore.discardCard(sel.id); cardStore.selectCard(""); }
        const opponent = movedColor === "w" ? "b" : "w";
        set({ board: game.board() as SquarePiece[][], turn: opponent, lastMove: { from, to }, skipCaptureFor: opponent });
        return true;
      }

      // 4) Movimientos legales y otros efectos manuales
      const legalMoves = game.moves({ verbose: true }) as Move[];
      let allowed = legalMoves.some((m) => m.from === from && m.to === to);
      let manual = false;
      let effectUsed = false;
      let movedColor: Color = currentTurn;
      let resultCaptured: string | undefined;
      let isB2K = false;

      if (!allowed && effectKey) {
        const c1 = fileToCol(from[0]), r1 = rankToRow(+from[1]);
        const c2 = fileToCol(to[0]), r2 = rankToRow(+to[1]);
        const dc = c2 - c1, dr = r2 - r1;
        switch (effectKey) {
          case "pawnBackward1":
            if (piece.type === "p" && dc === 0 && dr === (piece.color === "w" ? 1 : -1)) {
              allowed = manual = effectUsed = true;
            }
            break;
          case "pawnBackwardCapture":
            if (piece.type === "p" && Math.abs(dc) === 1 && dr === (piece.color === "w" ? 1 : -1) && targetPiece) {
              allowed = manual = effectUsed = true;
            }
            break;
          case "pawnSideStep":
            if (piece.type === "p" && dr === 0 && Math.abs(dc) === 1 && !targetPiece) {
              allowed = manual = effectUsed = true;
            }
            break;
          case "blockSquare":
            if (!targetPiece) {
              allowed = manual = effectUsed = true;
              set({ blockedSquare: to, blockedBy: currentTurn, blockedType: "normal" });
            }
            break;
          case "blockSquareRare":
            if (!targetPiece) {
              allowed = manual = effectUsed = true;
              set({ blockedSquare: to, blockedBy: currentTurn, blockedType: "rare" });
            }
            break;
          case "queenKnightMove": {
            const da = Math.abs(dr), db = Math.abs(dc);
            if (piece.type === "q" && ((da === 2 && db === 1) || (da === 1 && db === 2))) {
              allowed = manual = effectUsed = true;
            }
            break;
          }
          case "bishopReverseAndFlip":
            if (piece.type === "b" && dc === 0 && dr === (piece.color === "w" ? 1 : -1) && !targetPiece) {
              allowed = manual = effectUsed = true;
            }
            break;
          case "bishopToKnight":
            if (piece.type === "b" && targetPiece?.type === "n" && targetPiece.color === currentTurn) {
              allowed = manual = effectUsed = isB2K = true;
            }
            break;
          case "kingDoubleStep":
            if (piece.type === "k" && !targetPiece) {
              const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
              const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
              if (Math.max(Math.abs(dc), Math.abs(dr)) === 2) {
                let c = c1 + stepC, r = r1 + stepR;
                let clear = true;
                while (c !== c2 || r !== r2) {
                  const sq = "abcdefgh"[c] + (8 - r);
                  if (game.get(sq as Square)) { clear = false; break; }
                  c += stepC; r += stepR;
                }
                if (clear) allowed = manual = effectUsed = true;
              }
            }
            break;
          default:
            break;
        }
      }
      if (!allowed) return false;

      // 5) Ejecutar movimiento o efecto manual
      if (manual && effectUsed) {
        if (isB2K) {
          game.remove(to as Square);
          const knight: Piece = { type: 'n', color: currentTurn };
          game.remove(from as Square);
          game.put({ type: 'b', color: currentTurn }, to as Square);
          game.put(knight, from as Square);
          movedColor = currentTurn;
          resultCaptured = undefined;
          const fen = game.fen().split(' ');
          fen[1] = movedColor === 'w' ? 'b' : 'w';
          game.load(fen.join(' '));
        } else {
          if (effectKey === "pawnBackwardCapture" && targetPiece) game.remove(to as Square);
          game.remove(from as Square);
          game.put({ type: piece.type, color: piece.color }, to as Square);
          movedColor = piece.color;
          resultCaptured = targetPiece?.type;
          const fen = game.fen().split(" ");
          fen[1] = movedColor === "w" ? "b" : "w";
          game.load(fen.join(" "));
        }
      } else {
        const m = game.move({ from, to }); if (!m) return false;
        movedColor = m.color; resultCaptured = m.captured;
      }

      // 6) Primera captura
      if (resultCaptured && !cardStore.hasFirstCapture) {
        cardStore.markFirstCapture(movedColor);
        const next = movedColor === "w" ? "b" : "w";
        set({ board: game.board() as SquarePiece[][], turn: next, lastMove: { from, to } });
        return true;
      }

      // 7) Cambio de turno y limpieza de boquetes
      const prevSkip = get().skipCaptureFor;
      const nextTurn: Color = movedColor === "w" ? "b" : "w";
      const update: Partial<ChessState> = { board: game.board() as SquarePiece[][], turn: nextTurn, lastMove: { from, to } };
      if (get().blockedSquare && get().blockedBy && get().blockedBy !== movedColor) {
        update.blockedSquare = null; update.blockedBy = null; update.blockedType = null;
      }
      if (prevSkip === currentTurn) update.skipCaptureFor = null;
      set(update);

      // 8) Robar carta (no roba si se usó efecto)
      if (!effectUsed) {
        if (movedColor === "w") cardStore.drawCard(); else cardStore.drawOpponentCard();
      }

      // 9) Descartar carta usada
      if (effectUsed && effectKey && effectKey !== "noCaptureNextTurn") {
        const used = cardStore.hand.find((c) => c.effectKey === effectKey);
        if (used) { cardStore.discardCard(used.id); cardStore.selectCard(""); }
      }

      return true;
    },

    blockSquareAt: (sq: Square) => {
      const st = get(); if (st.blockedSquare || st.game.get(sq)) return;
      const cs = useCardStore.getState(); const sel = cs.selectedCard; if (!sel) return;
      const isRare = sel.effectKey === "blockSquareRare";
      const next = st.turn === "w" ? "b" : "w";
      const f = st.game.fen().split(" "); f[1] = next; st.game.load(f.join(" "));
      set({ blockedSquare: sq, blockedBy: st.turn, blockedType: isRare ? "rare" : "normal", turn: next, board: st.game.board() as SquarePiece[][], skipCaptureFor: st.skipCaptureFor });
      cs.discardCard(sel.id); cs.selectCard("");
    },

    reset: () => {
      const ng = new Chess();
      set({ game: ng, board: ng.board() as SquarePiece[][], turn: ng.turn(), lastMove: { from: null, to: null }, blockedSquare: null, blockedBy: null, blockedType: null, skipCaptureFor: null, notification: null });
    },
  };
});
