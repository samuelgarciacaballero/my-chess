import React from 'react';
import { useChessStore } from '../stores/useChessStore';
// import type { Color } from 'chess.js';

const TurnIndicator: React.FC = () => {
  const turn = useChessStore(state => state.turn);
  const colorName = turn === 'w' ? 'Blancas' : 'Negras';
  const colorHex  = turn === 'w' ? '#f5f5f5' : '#333';

  return (
    <div style={{
      padding: '0.5rem 1rem',
      margin: '1rem auto',
      width: 'fit-content',
      borderRadius: '8px',
      backgroundColor: colorHex,
      color: turn === 'w' ? '#333' : '#f5f5f5',
      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
      fontWeight: 'bold',
    }}>
      Turno: {colorName}
    </div>
  );
};

export default TurnIndicator;
