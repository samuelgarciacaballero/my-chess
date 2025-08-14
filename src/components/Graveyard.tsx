import React, { useState } from 'react';
import { useCardStore } from '../stores/useCardStore';
import cardBack from '../assets/card-back.jpeg';
import { rarityColors } from '../styles/cardColors';

const Graveyard: React.FC = () => {
  const graveyard = useCardStore((s) => s.graveyard);
  const [open, setOpen] = useState(false);

  return (
    <div style={{ textAlign: 'center' }}>
      <div
        style={{
          position: 'relative',
          width: 'calc(var(--square) * 8 / 3)',
          height: 'calc(var(--square) * 4)',
        }}
      >
        <img
          src={cardBack}
          alt="Cementerio"
          style={{ width: '100%', height: '100%', borderRadius: 8, cursor: 'pointer' }}
          onClick={() => setOpen((o) => !o)}
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
          {graveyard.length}
        </span>
        {open && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              background: 'var(--bg-color)',
              color: 'var(--text-color)',
              padding: '0.5rem',
              border: '1px solid #ccc',
              zIndex: 10,
              maxHeight: 200,
              overflowY: 'auto',
              width: 200,
            }}
          >
            <strong>Cementerio</strong>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {graveyard.map((c) => (
                <li
                  key={c.id}
                  style={{
                    background: rarityColors[c.rarity],
                    color: c.player === 'w' ? '#fff' : '#000',
                    borderRadius: 4,
                    padding: '2px 6px',
                    marginBottom: 4,
                  }}
                >
                  {c.name}
                  {c.hidden ? ' ¿?' : ''}

                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <div style={{ marginTop: 4 }}>Cementerio</div>

    </div>
  );
};

export default Graveyard;
