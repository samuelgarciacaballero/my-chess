// src/components/FaceUpCard.tsx
import React from 'react';
import type { Card } from '../stores/useCardStore';
import { rarityColors } from '../styles/cardColors';

interface FaceUpCardProps {
  card: Card;
}

const FaceUpCard: React.FC<FaceUpCardProps> = ({ card }) => {
  const bg = rarityColors[card.rarity];
  return (
    <div
      style={{
        border: '2px solid #333',
        borderRadius: '8px',
        padding: '1rem',
        width: '200px',
        textAlign: 'center',
        backgroundColor: bg,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
      }}
    >
      <h3 style={{ margin: '0 0 0.5rem' }}>Carta inicial</h3>
      <strong>{card.name}</strong>
      <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>{card.description}</p>
      <small>Rarity: {card.rarity}</small>
    </div>
  );
};

export default FaceUpCard;
