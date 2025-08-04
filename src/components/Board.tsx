import React from 'react';
import Square from './Square';
import Piece from './Piece';
import './Board.css';

const Board: React.FC = () => {
  const rows = Array.from({ length: 8 }, (_, row) => row);

  return (
    <div className="board">
      {rows.map(row =>
        rows.map(col => (
          <Square key={`${row}-${col}`} row={row} col={col}>
            <Piece row={row} col={col} />
          </Square>
        ))
      )}
    </div>
  );
};

export default Board;
