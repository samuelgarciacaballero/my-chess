import React from 'react';
import { useCardStore } from '../stores/useCardStore';
const cardBack = 'src/assets/card-back.png';

const DeckPile: React.FC = () => {
  const remaining = useCardStore((s) => s.deck.length);
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ position: 'relative', width: 80, height: 120 }}>
        <img
          src={cardBack}
          alt="Mazo"
          style={{ width: '100%', height: '100%', borderRadius: 8 }}
        />
        <span
          style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(0,0,0,0.7)',
            color: '#fff',
            padding: '2px 4px',
            borderRadius: 4,
            fontSize: '0.8rem',
          }}
        >
          {remaining}
        </span>
      </div>
      <div style={{ marginTop: 4 }}>Biblioteca</div>

    </div>
  );
};

export default DeckPile;
