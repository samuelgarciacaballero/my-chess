// src/components/Card.tsx
import React, { useRef, useState } from 'react';
import type { Card } from '../stores/useCardStore';
import { useCardStore } from '../stores/useCardStore';
import { rarityColors } from '../styles/cardColors';
import './Card.css';
import cardBack from '../assets/card-back.jpeg';
import { useConfirmStore } from '../stores/useConfirmStore';

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
  const confirm = useConfirmStore((s) => s.show);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<number>();

  const handleDiscard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm(`¿Descartar "${card.name}"?`);
    if (ok) {
      discardCard(card.id);
    }
  };

  // Background color según rareza
  if (faceDown) {
    if (fullView) {
      return (
        <div className="card back">
          <span style={{ fontSize: '2rem' }}>¿?</span>
        </div>
      );
    }
    return (
      <img
        src={cardBack}
        alt="Carta oculta"
        style={{
          width: 150,
          height: 210,
          borderRadius: 8,
          margin: '0.5rem',
        }}
      />
    );
  }

  const bgColor = rarityColors[card.rarity];
  const cls = `card${isSelected ? ' selected' : ''}`;

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (!fullView) return;
    timer.current = window.setTimeout(() => {
      setTooltip({ x: e.clientX, y: e.clientY });
    }, 750);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltip) {
      setTooltip({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseLeave = () => {
    window.clearTimeout(timer.current);
    setTooltip(null);
  };

  const handleSelect = async () => {
    if (readOnly) return;
    if (card.effectKey === 'hiddenDraw') {
      const ok = await confirm('¿Consumir "Artes Ocultas"?');
      if (ok) {
        discardCard(card.id);
        drawHiddenCard(player);
      }
      return;
    }
    onSelect?.(card.id);
  };

  return (
    <div
      onClick={handleSelect}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      className={cls}
      style={{ backgroundColor: bgColor }}
    >
      {card.hidden && <span className="hidden-indicator">¿?</span>}
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
      {fullView && tooltip && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y + 10,
            left: tooltip.x + 10,
            border: '2px dashed #f00',
            backgroundColor: rarityColors[card.rarity],
            opacity: 0.85,
            padding: '0.5rem',
            borderRadius: 8,
            zIndex: 1000,
            pointerEvents: 'none',
          }}
        >
          <p style={{ margin: 0 }}>{card.description}</p>
          <small>Rarity: {card.rarity}</small>
        </div>
      )}
    </div>
  );
};

export default CardView;
