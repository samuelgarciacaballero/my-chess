// src/components/Square.tsx
import React from 'react';
import { useDrop } from 'react-dnd';
import './Square.css';
import { useChessStore } from '../stores/useChessStore';
import { useCardStore } from '../stores/useCardStore';
import { toSquare } from '../utils/coords';
import type { Square as ChessSquare } from 'chess.js';

// Definimos la forma del item que llega al drop
interface DragItem {
  row: number;
  col: number;
}

const Square: React.FC<{
  row: number;
  col: number;
  children?: React.ReactNode;
}> = ({ row, col, children }) => {
  const isLight = (row + col) % 2 === 0;
  const move = useChessStore(state => state.move);
  const selectedCard = useCardStore(state => state.selectedCard);

  // Tipamos useDrop con <DragItem, void, { isOver: boolean; canDrop: boolean }>
  const [{ isOver, canDrop }, dropRef] = useDrop<DragItem, void, { isOver: boolean; canDrop: boolean }>({
    accept: 'piece',
    drop: (item: DragItem) => {
      const from = toSquare(item.row, item.col) as ChessSquare;
      const to = toSquare(row, col) as ChessSquare;
      move(from, to, selectedCard?.effectKey);
    },
    collect: monitor => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const highlight = isOver && canDrop ? ' highlight' : '';
  const className = `square ${isLight ? 'light' : 'dark'}${highlight}`;
  const element = <div className={className}>{children}</div>;

  return dropRef(element);
};

export default Square;
