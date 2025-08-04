// src/components/Piece.tsx
import React from 'react';
import { useDrag } from 'react-dnd';
import { useChessStore } from '../stores/useChessStore';
import type { SquarePiece } from '../stores/useChessStore';

const unicodeMap: Record<string, Record<'w' | 'b', string>> = {
  p: { w: '♙', b: '♟' },
  r: { w: '♖', b: '♜' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

interface PieceProps {
  row: number;
  col: number;
}

const Piece: React.FC<PieceProps> = ({ row, col }) => {
  const board = useChessStore(state => state.board);

  // 1) Hook al inicio, sin condiciones
  const [{ isDragging }, dragRef] = useDrag({
    type: 'piece',
    item: { row, col },
    collect: monitor => ({ isDragging: monitor.isDragging() }),
    canDrag: () => !!board[row][col],
  });

  const square: SquarePiece = board[row][col];
  if (!square) return null;

  const { type, color } = square;
  const symbol = unicodeMap[type][color];

  const element = (
    <div
      style={{
        fontSize: '2rem',
        cursor: 'grab',
        opacity: isDragging ? 0.5 : 1,
        userSelect: 'none',
      }}
    >
      {symbol}
    </div>
  );

  // 2) Envolvemos el elemento con dragRef(...) en vez de usar ref={dragRef}
  return dragRef(element);
};

export default Piece;
