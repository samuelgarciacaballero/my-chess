import React from 'react';
import Square from './Square';
import Piece from './Piece';
import './Board.css';

interface BoardProps {
  rotated?: boolean;
}

const Board: React.FC<BoardProps> = ({ rotated }) => {
  const rows = Array.from({ length: 8 }, (_, row) => row);
  const files = rotated
    ? ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a']
    : ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = rotated
    ? ['1', '2', '3', '4', '5', '6', '7', '8']
    : ['8', '7', '6', '5', '4', '3', '2', '1'];

  return (
    <div className="board-wrapper">
      <div className={`board${rotated ? ' rotated' : ''}`}>
        {rows.map((row) =>
          rows.map((col) => (
            <Square key={`${row}-${col}`} row={row} col={col}>
              <Piece row={row} col={col} />
            </Square>
          ))
        )}
      </div>
      <div className="coord-files top">
        {files.map((f) => (
          <span key={`t-${f}`}>{f}</span>
        ))}
      </div>
      <div className="coord-files bottom">
        {files.map((f) => (
          <span key={`b-${f}`}>{f}</span>
        ))}
      </div>
      <div className="coord-ranks left">
        {ranks.map((r) => (
          <span key={`l-${r}`}>{r}</span>
        ))}
      </div>
      <div className="coord-ranks right">
        {ranks.map((r) => (
          <span key={`r-${r}`}>{r}</span>
        ))}
      </div>
    </div>
  );
};

export default Board;
