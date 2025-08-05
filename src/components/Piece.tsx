// src/components/Piece.tsx
import React, { useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import { useChessStore } from "../stores/useChessStore";
import type { SquarePiece } from "../stores/useChessStore";
import { fromSquare } from "../utils/coords";
import "./Piece.css";

const unicodeMap: Record<string, Record<"w" | "b", string>> = {
  p: { w: "♙", b: "♟" },
  r: { w: "♖", b: "♜" },
  n: { w: "♘", b: "♞" },
  b: { w: "♗", b: "♝" },
  q: { w: "♕", b: "♛" },
  k: { w: "♔", b: "♚" },
};

interface PieceProps {
  row: number;
  col: number;
}

const Piece: React.FC<PieceProps> = ({ row, col }) => {
  const board = useChessStore((state) => state.board);
  const lastMove = useChessStore((s) => s.lastMove);

  const [{ isDragging }, dragRef, preview] = useDrag({
    type: "piece",
    item: { row, col },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
    canDrag: () => !!board[row][col],
  });

  useEffect(() => {
    preview(getEmptyImage(), { captureDraggingState: true });
  }, [preview]);

  const pieceRef = useRef<HTMLDivElement | null>(null);

  const square: SquarePiece = board[row][col];

  useEffect(() => {
    if (!lastMove.from || !lastMove.to || !pieceRef.current) return;
    if (!square) return;
    const to = fromSquare(lastMove.to);
    const from = fromSquare(lastMove.from);
    if (to.row === row && to.col === col) {
      const size = pieceRef.current.parentElement?.clientWidth ?? 60;
      const dx = (from.col - to.col) * size;
      const dy = (from.row - to.row) * size;
      const el = pieceRef.current;
      el.style.setProperty("--dx", `${dx}px`);
      el.style.setProperty("--dy", `${dy}px`);
      el.classList.remove("moving");
      void el.offsetWidth; // restart animation
      el.classList.add("moving");
    }
  }, [lastMove, row, col, square]);

  if (!square) return null;

  const { type, color } = square;
  const symbol = unicodeMap[type][color];

  return (
    <div
      ref={(node) => {
        pieceRef.current = node;
        dragRef(node);
      }}
      className="piece"
      style={{
        fontSize: "calc(var(--square) * 0.8)",
        cursor: "grab",
        opacity: isDragging ? 0.5 : 1,
        userSelect: "none",
      }}
    >
      {symbol}
    </div>
  );
};

export default Piece;
