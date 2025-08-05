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
      if (to === blockedSquare) return false;
      const pieceAtFrom = game.get(from as Square);
      if (blockedType === "rare" && pieceAtFrom?.type !== "n" && blockedSquare) {
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
      const piece = game.get(from as Square);
      if (!piece || piece.color !== currentTurn) return false;

      // Guardar FEN inicial (para otros efectos)
      // const initialFenParts = game.fen().split(" ");
      // const initialCastling = initialFenParts[2];

      // 1) Preparar flags
      let allowed = false;
      let manual = false;
      let effectUsed = false;
      // let castlePerformed = false;
      let resultCaptured: string | undefined;
      let movedColor: Color = currentTurn;

      // 2) Efecto kingFreeCastle: siempre override, restaurando derechos y dejando turno
      if (effectKey === "kingFreeCastle") {
        const destOk =
          (piece.color === "w" && to === "e1") ||
          (piece.color === "b" && to === "e8");
        if (piece.type === "k" && destOk) {
          // mover rey a origen
          game.remove(from as Square);
          game.put({ type: "k", color: piece.color }, to as Square);

          // restaurar derechos de enroque para color (KQ o kq)
          const newFenParts = game.fen().split(" ");
          newFenParts[2] = piece.color === "w" ? "KQ" : "kq";
          // mantener turno sin flip interno
          newFenParts[1] = currentTurn;
          game.load(newFenParts.join(" "));

          manual = effectUsed = true;
          allowed = true;
          movedColor = piece.color;
          // castlePerformed sigue false — turno se mantiene y rights quedan restaurados
        }
      }

      // 3) Movimientos legales normales y otros efectos
      const legalMoves = game.moves({ verbose: true }) as Move[];
      const target = game.get(to as Square);

      if (!manual) {
        // legal normal
        allowed = legalMoves.some(m => m.from === from && m.to === to);
        // otros efectos distintos de kingFreeCastle
        if (!allowed && effectKey) {
          const c1 = fileToCol(from[0]), r1 = rankToRow(+from[1]);
          const c2 = fileToCol(to[0]),   r2 = rankToRow(+to[1]);
          const dr = r2 - r1, dc = c2 - c1;
          switch (effectKey) {
            case "pawnBackward1":
              if (piece.type === "p" && dc === 0 && dr === (piece.color === "w" ? 1 : -1)) {
                allowed = effectUsed = manual = true;
              }
              break;
            case "pawnBackwardCapture":
              if (piece.type === "p" && Math.abs(dc) === 1 && dr === (piece.color === "w" ? 1 : -1) && target) {
                allowed = effectUsed = manual = true;
              }
              break;
            case "pawnSideStep":
              if (piece.type === "p" && dr === 0 && Math.abs(dc) === 1 && !target) {
                allowed = effectUsed = manual = true;
              }
              break;
            case "blockSquare":
              if (!target) {
                allowed = effectUsed = manual = true;
                set({ blockedSquare: to, blockedBy: currentTurn, blockedType: "normal" });
              }
              break;
            case "blockSquareRare":
              if (!target) {
                allowed = effectUsed = manual = true;
                set({ blockedSquare: to, blockedBy: currentTurn, blockedType: "rare" });
              }
              break;
            case "queenKnightMove":
              if (piece.type === "q") {
                const drA = Math.abs(dr), dcA = Math.abs(dc);
                if ((drA === 2 && dcA === 1) || (drA === 1 && dcA === 2)) {
                  allowed = effectUsed = manual = true;
                }
              }
              break;
            case "bishopReverseAndFlip":
              if (piece.type === "b" && dc === 0 && dr === (piece.color === "w" ? 1 : -1) && !target) {
                allowed = effectUsed = manual = true;
              }
              break;
            case "bishopToKnight":
              if (piece.type === "b" && target?.type === "n" && target.color === currentTurn) {
                allowed = effectUsed = manual = true;
              }
              break;
          }
        }
      }

      if (!allowed) return false;

      // 4) Ejecutar movimiento
      if (manual && effectUsed) {
        // kingFreeCastle ya ejecutado por game.load arriba
        if (effectKey !== "kingFreeCastle") {
          // otros efectos manuales
          if (effectKey === "pawnBackwardCapture" && target) {
            game.remove(to as Square);
          }
          game.remove(from as Square);
          game.put({ type: piece.type, color: piece.color }, to as Square);
          movedColor = piece.color;
          resultCaptured = target?.type;
          // flip interno de turno
          const fen = game.fen().split(" ");
          fen[1] = movedColor === "w" ? "b" : "w";
          game.load(fen.join(" "));
        }
      } else {
        // movimiento normal (incluye enroque estándar tras restaurar derechos)
        const m = game.move({ from, to });
        if (!m) return false;
        movedColor = m.color;
        resultCaptured = m.captured;
      }

      // 5) Primer captura
      if (resultCaptured && !cardStore.hasFirstCapture) {
        cardStore.markFirstCapture(movedColor);
        const next: Color = movedColor === "w" ? "b" : "w";
        set({ board: game.board() as SquarePiece[][], turn: next, lastMove: { from, to } });
        return true;
      }

      // 6) Cambio de turno
      let nextTurn: Color;
      if (effectKey === "kingFreeCastle") {
        // tras devolver rey y restaurar derechos, permitimos enroque y luego cambio de turno
        // aquí mantenemos turno solamente en la devolución; si el siguiente paso es enroque normal,
        // caerá en el else en la siguiente llamada a move y cambiará turno correctamente.
        nextTurn = currentTurn;
      } else {
        nextTurn = movedColor === "w" ? "b" : "w";
      }
      if (nextTurn === get().blockedBy) {
        set({ blockedSquare: null, blockedBy: null, blockedType: null });
      }
      set({ board: game.board() as SquarePiece[][], turn: nextTurn, lastMove: { from, to } });

      // 7) Robar carta
      if (!(effectUsed && (effectKey === "blockSquare" || effectKey === "blockSquareRare"))) {
        if (movedColor === "w") cardStore.drawCard();
        else cardStore.drawOpponentCard();
      }

      // 8) Descartar carta usada
      if (effectUsed && effectKey && effectKey !== "blockSquare" && effectKey !== "blockSquareRare") {
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
      const sel = cardStore.selectedCard;
      if (!sel) return;
      const isRare = sel.effectKey === "blockSquareRare";
      const next = state.turn === "w" ? "b" : "w";
      const fen = state.game.fen().split(" ");
      fen[1] = next; state.game.load(fen.join(" "));
      set({
        blockedSquare: sq,
        blockedBy: state.turn,
        blockedType: isRare ? "rare" : "normal",
        turn: next,
        board: state.game.board() as SquarePiece[][]
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
        blockedType: null
      });
    },
  };
});
