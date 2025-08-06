// src/stores/useChessStore.ts
import { create } from "zustand";
import { Chess } from "chess.js";
import type { Piece, Color, Square, Move, PieceSymbol } from "chess.js";
import { useCardStore } from "./useCardStore";
import { useOnlineStore } from "./useOnlineStore";

export interface LastMove {
  from: Square | null;
  to: Square | null;
}

// Para manejar peticiones de promoción
interface PromotionRequest {
  from: Square;
  to: Square;
  color: Color;
}

export type SquarePiece = Piece | null;

const knightMoves = [
  [1, 2],
  [2, 1],
  [2, -1],
  [1, -2],
  [-1, -2],
  [-2, -1],
  [-2, 1],
  [-1, 2],
];

function isSquareThreatenedByCard(
  game: Chess,
  square: Square,
  color: Color,
): boolean {
  const oppColor: Color = color === "w" ? "b" : "w";
  const cardStore = useCardStore.getState();
  const oppCards =
    oppColor === "w" ? cardStore.hand : cardStore.opponentHand;
  const board = game.board() as SquarePiece[][];

  if (oppCards.some((c) => c.effectKey === "queenKnightMove")) {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece?.color === oppColor && piece.type === "q") {
          for (const [dr, dc] of knightMoves) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr < 0 || nr > 7 || nc < 0 || nc > 7) continue;
            const target = (`abcdefgh`[nc] + (8 - nr)) as Square;
            const occ = game.get(target);
            if (occ?.color === oppColor) continue;
            if (target === square) return true;
          }
        }
      }
    }
  }

  if (oppCards.some((c) => c.effectKey === "pawnBackwardCapture")) {
    const dir = oppColor === "w" ? -1 : 1;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece?.color === oppColor && piece.type === "p") {
          const nr = r + dir;
          if (nr < 0 || nr > 7) continue;
          for (const dc of [-1, 1]) {
            const nc = c + dc;
            if (nc < 0 || nc > 7) continue;
            const target = (`abcdefgh`[nc] + (8 - nr)) as Square;
            const occ = game.get(target);
            if (occ?.color === oppColor) continue;
            if (target === square) return true;
          }
        }
      }
    }
  }

  return false;
}

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

  /** Petición de promoción pendiente, o null si no hay */
  promotionRequest: PromotionRequest | null;
  /** Selecciona pieza de promoción tras petición */
  selectPromotion: (pieceType: PieceSymbol) => void;

  move: (
    from: Square,
    to: Square,
    effectKey?: string,
    skipBroadcast?: boolean,
  ) => boolean;
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

    // --- PROMOCIÓN ---
    promotionRequest: null,
    selectPromotion: (pieceType) => {
      const req = get().promotionRequest;
      if (!req) return;
      const { from, to } = req;
      // ejecuta la jugada con promoción elegida
      const m = game.move({ from, to, promotion: pieceType });
      if (!m) return;
      // actualiza estado
      const nextTurn = game.turn();
      set({
        board: game.board() as SquarePiece[][],
        turn: nextTurn,
        lastMove: { from, to },
        promotionRequest: null,
      });
      const online = useOnlineStore.getState();
      if (online.connected) {
        online.socket?.send(
          JSON.stringify({ type: "move", from, to, promotion: pieceType })
        );
      }
    },

    move: (from, to, effectKey, skipBroadcast = false) => {
      try {
        const cardStore = useCardStore.getState();
        const currentTurn = get().turn;
        const online = useOnlineStore.getState();
        if (online.connected && !skipBroadcast && online.color !== currentTurn) {
          return false;
        }
        const piece = game.get(from as Square);
        if (!piece || piece.color !== currentTurn) return false;

        const maybeBroadcast = () => {
          if (!skipBroadcast && online.connected) {
            online.socket?.send(
              JSON.stringify({ type: "move", from, to, effectKey }),
            );
          }
        };

        const fenBefore = game.fen();

      // --- 1) Detección de PROMOCIÓN DE PEÓN ---
      const isPawn = piece.type === "p";
      const isLastRank =
        (piece.color === "w" && to[1] === "8") ||
        (piece.color === "b" && to[1] === "1");
      if (isPawn && isLastRank && !effectKey) {
        // abrimos menú de promoción
        set({ promotionRequest: { from, to, color: piece.color } });
        maybeBroadcast();
        return true;
      }

      // --- 2) Tratado de paz: bloquea capturas si corresponde ---
      const targetPiece = game.get(to as Square);
      const skipFor = get().skipCaptureFor;
      if (skipFor === currentTurn && targetPiece) {
        set({
          notification: "No puedes comer este turno por el tratado de paz",
        });
        return false;
      }

      // --- 3) Efecto undoTurn (DEJAVÚ) ---
      if (effectKey === "undoTurn") {
        const activeHand =
          currentTurn === "w" ? cardStore.hand : cardStore.opponentHand;
        const sel = activeHand.find((c) => c.effectKey === "undoTurn");
        if (!sel) return false;
        if (
          window.confirm("¿Deseas usar DEJAVÚ para deshacer tu último turno?")
        ) {
          game.undo(); // deshacer medio-turno (oponente)
          game.undo(); // deshacer tu turno
          // descartar carta
          cardStore.discardCard(sel.id);
          cardStore.selectCard("");
          // reset parcial
          set({
            board: game.board() as SquarePiece[][],
            turn: game.turn(),
            lastMove: { from: null, to: null },
            blockedSquare: null,
            blockedBy: null,
            blockedType: null,
            skipCaptureFor: null,
          });
          maybeBroadcast();
          return true;
        }
        return false;
      }

      // --- 4) Bloqueos de casilla normal/rare ---
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
          if (`abcdefgh`[c] + (8 - r) === blockedSquare) {
            set({
              notification: "En esta casilla hay un boquete infranqueable",
            });
            return false;
          }
          c += stepC;
          r += stepR;
        }
      }

      // --- 5) Efecto kingFreeCastle ---
      if (effectKey === "kingFreeCastle" && piece.type === "k") {
        const home: Square = piece.color === "w" ? "e1" : "e8";
        if (to === home) {
          game.remove(from as Square);
          game.put({ type: "k", color: piece.color }, home);
          const fenParts = game.fen().split(" ");
          fenParts[2] = piece.color === "w" ? "KQ" : "kq";
          fenParts[1] = currentTurn; // mantenemos turno interno
          game.load(fenParts.join(" "));
          const activeHand =
            currentTurn === "w" ? cardStore.hand : cardStore.opponentHand;
          const sel = activeHand.find((c) => c.effectKey === "kingFreeCastle");
          if (sel) {
            cardStore.discardCard(sel.id);
            cardStore.selectCard("");
          }
            set({
              board: game.board() as SquarePiece[][],
              turn: currentTurn,
              lastMove: { from, to: home },
            });
            maybeBroadcast();
            return true;
          }
          return false;
        }

      // --- 6) Efecto noCaptureNextTurn ---
      if (effectKey === "noCaptureNextTurn") {
        const legal = game.moves({ verbose: true }) as Move[];
        if (!legal.some((m) => m.from === from && m.to === to)) return false;
        const m = game.move({ from, to });
        if (!m) return false;
        const movedColor = m.color;
        const activeHand =
          currentTurn === "w" ? cardStore.hand : cardStore.opponentHand;
        const sel = activeHand.find((c) => c.effectKey === "noCaptureNextTurn");
        if (sel) {
          cardStore.discardCard(sel.id);
          cardStore.selectCard("");
        }
        const opponent = movedColor === "w" ? "b" : "w";
          set({
            board: game.board() as SquarePiece[][],
            turn: opponent,
            lastMove: { from, to },
            skipCaptureFor: opponent,
          });
          maybeBroadcast();
          return true;
        }

      // --- 7) Movimientos legales y otros efectos manuales ---
      const legalMoves = game.moves({ verbose: true }) as Move[];
      let allowed = legalMoves.some((m) => m.from === from && m.to === to);
      let manual = false;
      let effectUsed = false;
      let movedColor: Color = currentTurn;
      let resultCaptured: string | undefined;
      let isB2K = false;

      if (!allowed && effectKey) {
        const c1 = fileToCol(from[0]),
          r1 = rankToRow(+from[1]);
        const c2 = fileToCol(to[0]),
          r2 = rankToRow(+to[1]);
        const dc = c2 - c1,
          dr = r2 - r1;
        switch (effectKey) {
          case "pawnBackward1":
            if (
              piece.type === "p" &&
              dc === 0 &&
              dr === (piece.color === "w" ? 1 : -1)
            ) {
              allowed = manual = effectUsed = true;
            }
            break;
          case "pawnBackwardCapture":
            if (
              piece.type === "p" &&
              Math.abs(dc) === 1 &&
              dr === (piece.color === "w" ? 1 : -1) &&
              targetPiece
            ) {
              allowed = manual = effectUsed = true;
            }
            break;
          case "pawnSideStep":
            if (
              piece.type === "p" &&
              dr === 0 &&
              Math.abs(dc) === 1 &&
              !targetPiece
            ) {
              allowed = manual = effectUsed = true;
            }
            break;
          case "blockSquare":
            if (!targetPiece) {
              allowed = manual = effectUsed = true;
              set({
                blockedSquare: to,
                blockedBy: currentTurn,
                blockedType: "normal",
              });
            }
            break;
          case "blockSquareRare":
            if (!targetPiece) {
              allowed = manual = effectUsed = true;
              set({
                blockedSquare: to,
                blockedBy: currentTurn,
                blockedType: "rare",
              });
            }
            break;
          case "queenKnightMove": {
            const da = Math.abs(dr),
              db = Math.abs(dc);
            if (
              piece.type === "q" &&
              ((da === 2 && db === 1) || (da === 1 && db === 2))
            ) {
              allowed = manual = effectUsed = true;
            }
            break;
          }
          case "bishopReverseAndFlip":
            if (
              piece.type === "b" &&
              dc === 0 &&
              dr === (piece.color === "w" ? 1 : -1) &&
              !targetPiece
            ) {
              allowed = manual = effectUsed = true;
            }
            break;
          case "bishopToKnight":
            if (
              piece.type === "b" &&
              targetPiece?.type === "n" &&
              targetPiece.color === currentTurn
            ) {
              allowed = manual = effectUsed = isB2K = true;
            }
            break;

          case "kingDoubleStep":
            if (piece.type === "k" && !targetPiece) {
              const stepC = dc === 0 ? 0 : dc / Math.abs(dc);
              const stepR = dr === 0 ? 0 : dr / Math.abs(dr);
              if (Math.max(Math.abs(dc), Math.abs(dr)) === 2) {
                let c = c1 + stepC,
                  r = r1 + stepR;
                let clear = true;
                while (c !== c2 || r !== r2) {
                  const sq = "abcdefgh"[c] + (8 - r);
                  if (game.get(sq as Square)) {
                    clear = false;
                    break;
                  }
                  c += stepC;
                  r += stepR;
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

      if (
        piece.type === "k" &&
        isSquareThreatenedByCard(game, to as Square, piece.color)
      ) {
        set({
          notification:
            "Esa casilla del rey está amenazada por una carta rival",
        });
        return false;
      }

      // --- 8) Ejecutar movimiento o efecto manual ---
      if (manual && effectUsed) {
        if (isB2K) {
          game.remove(to as Square);
          const knight: Piece = { type: "n", color: currentTurn };
          game.remove(from as Square);
          game.put({ type: "b", color: currentTurn }, to as Square);
          game.put(knight, from as Square);
          movedColor = currentTurn;
          resultCaptured = undefined;
          if (game.inCheck()) {
            game.load(fenBefore);
            set({
              notification:
                "Debes bloquear el jaque o mover tu rey fuera del jaque",
            });
            return false;
          }
          const fen = game.fen().split(" ");
          fen[1] = movedColor === "w" ? "b" : "w";
          game.load(fen.join(" "));
        } else {
          if (effectKey === "pawnBackwardCapture" && targetPiece)
            game.remove(to as Square);
          game.remove(from as Square);
          game.put({ type: piece.type, color: piece.color }, to as Square);
          movedColor = piece.color;
          resultCaptured = targetPiece?.type;
          if (game.inCheck()) {
            game.load(fenBefore);
            set({
              notification:
                "Debes bloquear el jaque o mover tu rey fuera del jaque",
            });
            return false;
          }
          const fen = game.fen().split(" ");
          fen[1] = movedColor === "w" ? "b" : "w";
          game.load(fen.join(" "));
        }
      } else {
        const m = game.move({ from, to });
        if (!m) {
          set({
            notification: game.inCheck()
              ? "Debes bloquear el jaque o mover tu rey"
              : "Movimiento ilegal",
          });
          return false;
        }
        movedColor = m.color;
        resultCaptured = m.captured;
      }

      // --- 9) Primera captura ---
      if (resultCaptured && !cardStore.hasFirstCapture) {
        cardStore.markFirstCapture(movedColor);
        const nt = movedColor === "w" ? "b" : "w";
          set({
            board: game.board() as SquarePiece[][],
            turn: nt,
            lastMove: { from, to },
          });
          maybeBroadcast();
          return true;
        }

      // --- 10) Cambio de turno y limpieza de boquetes ---
      const prevSkip = get().skipCaptureFor;
      const prevBlockedBy = get().blockedBy;
      const nextTurn: Color = movedColor === "w" ? "b" : "w";
      const update: Partial<ChessState> = {
        board: game.board() as SquarePiece[][],
        turn: nextTurn,
        lastMove: { from, to },
      };
      if (get().blockedSquare && prevBlockedBy === nextTurn) {
        update.blockedSquare = null;
        update.blockedBy = null;
        update.blockedType = null;
      }
      if (prevSkip === currentTurn) {
        update.skipCaptureFor = null;
      }
        set(update);

      // --- 11) Robar carta si no fue bloqueo ---
      if (!effectUsed) {
        if (movedColor === "w") cardStore.drawCard();
        else cardStore.drawOpponentCard();
      }

      // --- 12) Descartar carta usada ---
      if (effectUsed && effectKey && effectKey !== "noCaptureNextTurn") {
        const activeHand =
          movedColor === "w" ? cardStore.hand : cardStore.opponentHand;
        const used = activeHand.find((c) => c.effectKey === effectKey);
        if (used) {
          cardStore.discardCard(used.id);
          cardStore.selectCard("");
        }
      }

        maybeBroadcast();
        return true;
      } catch (e) {
        console.error(e);
        set({ notification: `Error: ${(e as Error).message}` });
        return false;
      }
    },

    blockSquareAt: (sq: Square) => {
      const st = get();
      if (st.blockedSquare || st.game.get(sq)) return;
      const cs = useCardStore.getState();
      const sel = cs.selectedCard;
      if (!sel) return;

      const isRare = sel.effectKey === "blockSquareRare";
      // const next = st.turn === "w" ? "b" : "w";

      // // reconstruimos FEN con el turno alternado
      // const f = st.game.fen().split(" ");
      // f[1] = next;
      // st.game.load(f.join(" ")); // ← aquí estaba el bug: usar join(" ") no join("")

      set({
        blockedSquare: sq,
        blockedBy: st.turn,
        blockedType: isRare ? "rare" : "normal",
        // turn: next,
        board: st.game.board() as SquarePiece[][],
        skipCaptureFor: st.skipCaptureFor,
      });

      cs.discardCard(sel.id);
      cs.selectCard("");
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
        promotionRequest: null,
      });
    },
  };
});
