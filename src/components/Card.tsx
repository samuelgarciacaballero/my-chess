// src/components/Card.tsx
import React from 'react';
import type { Card } from '../stores/useCardStore';
import { useCardStore } from '../stores/useCardStore';
import { rarityColors } from '../styles/cardColors';
import './Card.css';

interface CardProps {
  card: Card;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  readOnly?: boolean;
  showRarity?: boolean;
}

const CardView: React.FC<CardProps> = ({
  card,
  isSelected,
  onSelect,
  readOnly,
  showRarity = true,
}) => {
  const discardCard = useCardStore((state) => state.discardCard);

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Descartar "${card.name}"?`)) {
      discardCard(card.id);
    }
  };

  // Background color según rareza
  const bgColor = rarityColors[card.rarity];
  const cls = `card${isSelected ? ' selected' : ''}`;

  return (
    <div
      onClick={() => onSelect?.(card.id)}
      className={cls}
      style={{ backgroundColor: bgColor }}
    >
      {!readOnly && (
        <button onClick={handleDiscard} className="discard-btn">
          ×
        </button>
      )}

      <h4 style={{ margin: '0 0 0.25rem' }}>{card.name}</h4>
      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
        {card.description}
      </p>
      {showRarity && <small>Rarity: {card.rarity}</small>}
    </div>
  );
};

export default CardView;
