// src/components/Square.tsx
import React, { useState } from "react";
import { useDrop } from "react-dnd";
import "./Square.css";
import { useChessStore } from "../stores/useChessStore";
import { useCardStore } from "../stores/useCardStore";
import { toSquare } from "../utils/coords";
import type { Square as ChessSquare } from "chess.js";

interface SquareProps {
  row: number;
  col: number;
  children?: React.ReactNode;
}

const Square: React.FC<SquareProps> = ({ row, col, children }) => {
  const isLight = (row + col) % 2 === 0;
  const move = useChessStore(s => s.move);
  const blockSquareAt = useChessStore(s => s.blockSquareAt);
  const selectedCard = useCardStore(s => s.selectedCard);
  const blockedSquare = useChessStore(s => s.blockedSquare);
  const blockedBy = useChessStore(s => s.blockedBy);
  const lastMove = useChessStore(s => s.lastMove);

  const [hover, setHover] = useState(false);

  const [{ isOver, canDrop }, dropRef] = useDrop<
    { row: number; col: number },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: "piece",
    drop: item => {
      move(
        toSquare(item.row, item.col) as ChessSquare,
        toSquare(row, col) as ChessSquare,
        selectedCard?.effectKey
      );
    },
    collect: m => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  });

  const highlight = isOver && canDrop ? " highlight" : "";
  const sq = toSquare(row, col);

  // Resaltado de última jugada
  const isFrom = lastMove.from === sq;
  const isTo   = lastMove.to   === sq;
  const lastCls = isFrom ? " last-from" : isTo ? " last-to" : "";

  const className = `square ${isLight ? "light" : "dark"}${highlight}${lastCls}`;

  // Overlay permanente (casilla bloqueada)
  const permanentOverlay =
    sq === blockedSquare && blockedBy ? (
      <div className={`blocked-overlay ${blockedBy}`}>✕</div>
    ) : null;

  // Overlay de preview para “Boquete” normal o raro
  const isBlockingCard =
    selectedCard?.effectKey === "blockSquare" ||
    selectedCard?.effectKey === "blockSquareRare";

  const previewOverlay =
    hover && isBlockingCard && !blockedSquare ? (
      <div className="blocked-overlay preview">✕</div>
    ) : null;

  // Click para aplicar “Boquete” normal o raro
  const handleClick = () => {
    if (isBlockingCard) {
      blockSquareAt(sq as ChessSquare);
    }
  };

  return dropRef(
    <div
      className="square-container"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleClick}
    >
      <div className={className}>
        {children}
        {permanentOverlay}
        {previewOverlay}
      </div>
    </div>
  );
};

export default Square;
