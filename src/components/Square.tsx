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
  const move = useChessStore((s) => s.move);
  const blockSquareAt = useChessStore((s) => s.blockSquareAt);
  // Justo arriba de tu componente:
  const selectedCard = useCardStore((s) => s.selectedCard);
  const blockedSquare = useChessStore((s) => s.blockedSquare);
  const blockedBy = useChessStore((s) => s.blockedBy);

  // const { selectedCard, blockedSquare, blockedBy } = useCardStore((s) => ({
  //   selectedCard: s.selectedCard,
  //   blockedSquare: useChessStore.getState().blockedSquare,
  //   blockedBy: useChessStore.getState().blockedBy,
  // }));

  // estado para hover preview
  const [hover, setHover] = useState(false);

  const [{ isOver, canDrop }, dropRef] = useDrop<
    { row: number; col: number },
    void,
    { isOver: boolean; canDrop: boolean }
  >({
    accept: "piece",
    drop: (item) => {
      move(
        toSquare(item.row, item.col) as ChessSquare,
        toSquare(row, col) as ChessSquare,
        selectedCard?.effectKey
      );
    },
    collect: (m) => ({ isOver: m.isOver(), canDrop: m.canDrop() }),
  });

  const highlight = isOver && canDrop ? " highlight" : "";
  const baseClass = `square ${isLight ? "light" : "dark"}${highlight}`;
  const sq = toSquare(row, col);

  // overlay permanente (bloqueada)
  const permanentOverlay =
    sq === blockedSquare && blockedBy ? (
      <div className={`blocked-overlay ${blockedBy}`}>✕</div>
    ) : null;

  // overlay de preview (hover + carta boquete)
  const previewOverlay =
    hover && selectedCard?.effectKey === "blockSquare" && !blockedSquare ? (
      <div className="blocked-overlay preview">✕</div>
    ) : null;

  // click para bloquear realmente
  const handleClick = () => {
    if (selectedCard?.effectKey === "blockSquare") {
      console.log("🎯 Click boquete en", sq);
      // toSquare devuelve string, aquí lo casteamos a ChessSquare/Square
      blockSquareAt(sq as ChessSquare);
    }
  };

  const element = (
    <div
      className="square-container"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={handleClick}
    >
      <div className={baseClass}>
        {children}
        {permanentOverlay}
        {previewOverlay}
      </div>
    </div>
  );

  return dropRef(element);
};

export default Square;
