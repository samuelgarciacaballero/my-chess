import { create } from 'zustand';
import { Chess } from 'chess.js';
import type { Piece, Color, Square, Move } from 'chess.js';
import { useCardStore } from './useCardStore';

export type SquarePiece = Piece | null;

interface ChessState {
  game: Chess;
  board: SquarePiece[][];
  turn: Color;
  move: (from: Square, to: Square, effectKey?: string) => boolean;
  reset: () => void;
}

export const useChessStore = create<ChessState>((set, get) => {
  const game = new Chess();

  // Convierte file/rank a índices numéricos
  const fileToCol = (f: string) => 'abcdefgh'.indexOf(f);
  const rankToRow = (r: number) => 8 - r;

  return {
    game,
    board: game.board() as SquarePiece[][],
    turn: game.turn(),

    move: (from, to, effectKey) => {
      const cardStore = useCardStore.getState();
      const currentTurn = get().turn;

      // 1) Comprobar que la pieza movida corresponde al turno
      const piece = game.get(from as Square);
      if (!piece || piece.color !== currentTurn) return false;

      // 2) Movimientos estándar legales
      const legalMoves = game.moves({ verbose: true }) as Move[];
      let allowed = legalMoves.some(m => m.from === from && m.to === to);

      const targetPiece = game.get(to as Square);
      let effectUsed = false;
      let manual = false;
      let movedColor: Color;

      // 3) Reglas especiales si hay carta
      if (!allowed && effectKey && piece) {
        const col1 = fileToCol(from[0]);
        const row1 = rankToRow(parseInt(from[1], 10));
        const col2 = fileToCol(to[0]);
        const row2 = rankToRow(parseInt(to[1], 10));
        const dr = row2 - row1;
        const dc = col2 - col1;

        switch (effectKey) {
          case 'pawnBackward1':
            // Peón miedica normal: mueve 1 casilla hacia atrás
            if (
              piece.type === 'p' &&
              dc === 0 &&
              dr === (piece.color === 'w' ? 1 : -1)
            ) {
              allowed = true;
              effectUsed = true;
              manual = true;
            }
            break;

          case 'pawnBackwardCapture':
            // Peón miedica raro: captura en diagonal hacia atrás
            if (
              piece.type === 'p' &&
              Math.abs(dc) === 1 &&
              dr === (piece.color === 'w' ? 1 : -1) &&
              targetPiece != null
            ) {
              allowed = true;
              effectUsed = true;
              manual = true;
            }
            break;

          // …otros effectKey…
        }
      }

      if (!allowed) return false;

      let resultCaptured: string | undefined;

      // 4) Ejecutar movimiento
      if (manual && effectUsed && piece) {
        // Captura manual
        if (effectKey === 'pawnBackwardCapture' && targetPiece) {
          game.remove(to as Square);
        }
        game.remove(from as Square);
        game.put({ type: piece.type, color: piece.color }, to as Square);
        movedColor = piece.color;
        resultCaptured = targetPiece?.type;

        // — Importante — forzar cambio interno de turno en chess.js
        const nextInternal: Color = movedColor === 'w' ? 'b' : 'w';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (game as any)._turn = nextInternal;
      } else {
        // Movimiento estándar
        const m = game.move({ from, to });
        if (!m) return false;
        movedColor = m.color;
        resultCaptured = m.captured;
      }

      // 5) Primera captura: asignar carta inicial y pasar turno, sin robar
      if (resultCaptured && !cardStore.hasFirstCapture) {
        cardStore.markFirstCapture();
        const nextTurn: Color = movedColor === 'w' ? 'b' : 'w';
        set({
          board: game.board() as SquarePiece[][],
          turn: nextTurn,
        });
        return true;
      }

      // 6) Turno normal: siempre alterna
      const nextTurn: Color = movedColor === 'w' ? 'b' : 'w';
      set({
        board: game.board() as SquarePiece[][],
        turn: nextTurn,
      });

      // 7) Robar carta al jugador activo (solo si no vino de un efecto)
      if (!effectUsed) {
        if (movedColor === 'w') {
          cardStore.drawCard();
        } else {
          cardStore.drawOpponentCard();
        }
      }

      // 8) Descartar carta usada si su efecto aplicó
      if (effectUsed && effectKey) {
        const usedCard = cardStore.hand.find(c => c.effectKey === effectKey);
        if (usedCard) cardStore.discardCard(usedCard.id);
        cardStore.selectCard('');
      }

      return true;
    },

    reset: () => {
      const newGame = new Chess();
      set({
        game: newGame,
        board: newGame.board() as SquarePiece[][],
        turn: newGame.turn(),
      });
    },
  };
});
