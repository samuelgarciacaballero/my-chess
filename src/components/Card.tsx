// src/components/Card.tsx
import React from 'react';
import type { Card } from '../stores/useCardStore';
import { useCardStore } from '../stores/useCardStore';

interface CardProps {
  card: Card;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const CardView: React.FC<CardProps> = ({ card, isSelected, onSelect }) => {
  const discardCard = useCardStore(state => state.discardCard);

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Descartar "${card.name}"?`)) {
      discardCard(card.id);
    }
  };

  return (
    <div
      onClick={() => onSelect(card.id)}
      style={{
        position: 'relative',
        border: isSelected ? '2px solid gold' : '1px solid #333',
        borderRadius: '8px',
        padding: '0.5rem',
        margin: '0.5rem',
        width: '140px',
        cursor: 'pointer',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}
    >
      {/* Botón de descartar */}
      <button
        onClick={handleDiscard}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          border: 'none',
          background: 'transparent',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        ×
      </button>

      <h4 style={{ margin: '0 0 0.25rem' }}>{card.name}</h4>
      <p style={{ fontSize: '0.85rem' }}>{card.description}</p>
      <small>Rarity: {card.rarity}</small>
    </div>
  );
};

export default CardView;
