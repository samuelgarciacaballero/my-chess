// src/components/Card.tsx
import React from 'react';
import type { Card } from '../stores/useCardStore';
import { useCardStore } from '../stores/useCardStore';
import { rarityColors } from '../styles/cardColors';
import './Card.css';
import cardBack from '../assets/card-back.jpeg';

interface CardProps {
  card: Card;
  isSelected: boolean;
  onSelect?: (id: string) => void;
  readOnly?: boolean;
  showRarity?: boolean;
  showDescription?: boolean;
  player: 'w' | 'b';
  faceDown?: boolean;
  fullView?: boolean;
}

const CardView: React.FC<CardProps> = ({
  card,
  isSelected,
  onSelect,
  readOnly,
  showRarity = true,
  showDescription = true,
  player,
  faceDown,
  fullView,
}) => {
  const discardCard = useCardStore((state) => state.discardCard);
  const drawHiddenCard = useCardStore((s) => s.drawHiddenCard);

  const handleDiscard = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Descartar "${card.name}"?`)) {
      discardCard(card.id);
    }
  };

  // Background color según rareza
  if (faceDown) {
    return (
      <div className="card back">
        {fullView ? (
          <span style={{ fontSize: '2rem' }}>¿?</span>
        ) : (
          <img
            src={cardBack}
            alt="Carta oculta"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>
    );
  }

  const bgColor = rarityColors[card.rarity];
  const cls = `card${isSelected ? ' selected' : ''}`;

  const handleSelect = () => {
    if (readOnly) return;
    if (card.effectKey === 'hiddenDraw') {
      if (window.confirm('¿Consumir "Artes Ocultas"?')) {
        drawHiddenCard(player);
        discardCard(card.id);
      }
      return;
    }
    onSelect?.(card.id);
  };

  return (
    <div
      onClick={handleSelect}
      className={cls}
      style={{ backgroundColor: bgColor }}
    >
      {!readOnly && (
        <button onClick={handleDiscard} className="discard-btn">
          ×
        </button>
      )}

      <h4 style={{ margin: '0 0 0.25rem' }}>{card.name}</h4>
      {showDescription && (
        <p style={{ fontSize: '0.85rem', margin: '0.25rem 0' }}>
          {card.description}
        </p>
      )}
      {showRarity && <small>Rarity: {card.rarity}</small>}
    </div>
  );
};

export default CardView;
