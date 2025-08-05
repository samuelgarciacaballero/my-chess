import { create } from "zustand";
import { Chess } from "chess.js";
import type { Piece, Color, Square, Move } from "chess.js";
import { useCardStore } from "./useCardStore";

export type SquarePiece = Piece | null;

interface ChessState {
  game: Chess;
  board: SquarePiece[][];
  turn: Color;
  blockedSquare: Square | null;
  blockedBy: Color | null;
  move: (from: Square, to: Square, effectKey?: string) => boolean;
  blockSquareAt: (sq: Square) => void;
  reset: () => void;
}

export const useChessStore = create<ChessState>((set, get) => {
  const game = new Chess();

  // Convierte file/rank a índices numéricos
  const fileToCol = (f: string) => "abcdefgh".indexOf(f);
  const rankToRow = (r: number) => 8 - r;

  return {
    game,
    board: game.board() as SquarePiece[][],
    turn: game.turn(),
    blockedSquare: null,
    blockedBy: null,

    move: (from, to, effectKey) => {
      // 0) nadie puede moverse a la casilla bloqueada
      if (to === get().blockedSquare) return false;
      const cardStore = useCardStore.getState();
      const currentTurn = get().turn;

      // 1) Comprobar que la pieza movida corresponde al turno
      const piece = game.get(from as Square);
      if (!piece || piece.color !== currentTurn) return false;

      // 2) Movimientos estándar legales
      const legalMoves = game.moves({ verbose: true }) as Move[];
      let allowed = legalMoves.some((m) => m.from === from && m.to === to);

      const targetPiece = game.get(to as Square);
      let effectUsed = false;
      let manual = false;
      let movedColor: Color;

      // 3) Reglas especiales si hay carta
      if (!allowed && effectKey) {
        const col1 = fileToCol(from[0]);
        const row1 = rankToRow(parseInt(from[1], 10));
        const col2 = fileToCol(to[0]);
        const row2 = rankToRow(parseInt(to[1], 10));
        const dr = row2 - row1;
        const dc = col2 - col1;

        switch (effectKey) {
          case "pawnBackward1":
            if (piece.type === "p" && dc === 0 && dr === (piece.color === "w" ? 1 : -1)) {
              allowed = true;
              effectUsed = true;
              manual = true;
            }
            break;
          case "pawnBackwardCapture":
            if (piece.type === "p" && Math.abs(dc) === 1 && dr === (piece.color === "w" ? 1 : -1) && targetPiece) {
              allowed = true;
              effectUsed = true;
              manual = true;
            }
            break;
          case "pawnSideStep":
            if (piece.type === "p" && dr === 0 && Math.abs(dc) === 1 && !targetPiece) {
              allowed = true;
              effectUsed = true;
              manual = true;
            }
            break;
          case "blockSquare":
            if (!targetPiece) {
              allowed = true;
              effectUsed = true;
              manual = true;
              set({ blockedSquare: to, blockedBy: currentTurn });
            }
            break;
        }
      }

      if (!allowed) return false;

      let resultCaptured: string | undefined;

      // 4) Ejecutar movimiento o manual
      if (manual && effectUsed) {
        if (effectKey === "pawnBackwardCapture" && targetPiece) {
          game.remove(to as Square);
        }
        game.remove(from as Square);
        game.put({ type: piece.type, color: piece.color }, to as Square);
        movedColor = piece.color;
        resultCaptured = targetPiece?.type;
      } else {
        const m = game.move({ from, to });
        if (!m) return false;
        movedColor = m.color;
        resultCaptured = m.captured;
      }

      // 5) Primera captura
      if (resultCaptured && !cardStore.hasFirstCapture) {
        cardStore.markFirstCapture();
        const nextTr = movedColor === "w" ? "b" : "w";
        set({ board: game.board() as SquarePiece[][], turn: nextTr });
        return true;
      }

      // 6) Turno normal, limpia bloqueo si toca tu turno
      const nextTr = movedColor === "w" ? "b" : "w";
      if (nextTr === get().blockedBy) {
        set({ blockedSquare: null, blockedBy: null });
      }
      set({ board: game.board() as SquarePiece[][], turn: nextTr });

      // 7) Robar carta
      if (!effectUsed) {
        if (movedColor === "w") {
          cardStore.drawCard();
        } else {
          cardStore.drawOpponentCard();
        }
      }

      // 8) Descartar carta usada
      if (effectUsed && effectKey) {
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
      // solo si no existe bloqueo y la casilla está vacia
      if (state.blockedSquare || state.game.get(sq)) return;
      console.log('🔒 blockSquareAt:', sq, 'by', state.turn);
      const nextTr: Color = state.turn === 'w' ? 'b' : 'w';
      // actualiza turno interno recargando FEN con nuevo turno
      const fenParts = state.game.fen().split(' ');
      fenParts[1] = nextTr;
      state.game.load(fenParts.join(' '));
      // actualiza estado (board para re-render)
      set({
        blockedSquare: sq,
        blockedBy: state.turn,
        turn: nextTr,
        board: state.game.board() as SquarePiece[][],
      });
      // descartar carta y limpiar selección
      const cardStore = useCardStore.getState();
      const used = cardStore.hand.find((c) => c.effectKey === 'blockSquare');
      if (used) {
        cardStore.discardCard(used.id);
        cardStore.selectCard('');
      }
    },

    reset: () => {
      const newGame = new Chess();
      set({
        game: newGame,
        board: newGame.board() as SquarePiece[][],
        turn: newGame.turn(),
        blockedSquare: null,
        blockedBy: null
      });
    },
  };
});
