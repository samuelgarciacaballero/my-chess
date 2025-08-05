// src/components/Card.tsx
import React from 'react';
import type { Card } from '../stores/useCardStore';
import { useCardStore } from '../stores/useCardStore';
import { rarityColors } from '../styles/cardColors';

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

  // Background color según rareza
  const bgColor = rarityColors[card.rarity];
  const borderStyle = isSelected ? '3px solid #333' : '1px solid #555';

  return (
    <div
      onClick={() => onSelect(card.id)}
      style={{
        position: 'relative',
        backgroundColor: bgColor,
        border: borderStyle,
        borderRadius: '8px',
        padding: '0.75rem',
        margin: '0.5rem',
        width: '150px',
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <button
        onClick={handleDiscard}
        style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          border: 'none',
          background: 'transparent',
          fontSize: '1.1rem',
          fontWeight: 'bold',
          cursor: 'pointer',
        }}
      >
        ×
      </button>

      <h4 style={{ margin: '0 0 0.25rem' }}>{card.name}</h4>
      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
        {card.description}
      </p>
      <small>Rarity: {card.rarity}</small>
    </div>
  );
};

export default CardView;
