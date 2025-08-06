import React from 'react';
import Square from './Square';
import Piece from './Piece';
import './Board.css';

interface BoardProps {
  rotated?: boolean;
}

const Board: React.FC<BoardProps> = ({ rotated }) => {
  const rows = Array.from({ length: 8 }, (_, row) => row);

  return (
    <div className={`board${rotated ? ' rotated' : ''}`}>
      {rows.flatMap((row) =>
        rows.map((col) => (
          <Square key={`${row}-${col}`} row={row} col={col}>
            <Piece row={row} col={col} />
          </Square>
        ))
      )}
    </div>
  );
};

export default Board;
