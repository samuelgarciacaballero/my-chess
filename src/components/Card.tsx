// src/components/Card.tsx
import React, { useRef, useState } from 'react';
import type { Card } from '../stores/useCardStore';
import { useCardStore } from '../stores/useCardStore';
import { rarityColors } from '../styles/cardColors';
import './Card.css';
import cardBack from '../assets/card-back.jpeg';
import { useConfirmStore } from '../stores/useConfirmStore';
import { useChessStore } from '../stores/useChessStore';


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
  const socket = useChessStore((s) => s.socket);
  const [tooltip, setTooltip] = useState<{ x: number; y: number } | null>(null);
  const timer = useRef<number | null>(null);


  const handleDiscard = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm(`¿Descartar "${card.name}"?`);
    if (ok) {
      discardCard(card.id);
      socket?.emit('card', { action: 'discard', id: card.id });
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
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
    }
    setTooltip(null);
  };

  const handleSelect = async () => {
    if (readOnly) return;
    if (card.effectKey === 'hiddenDraw') {
      const ok = await confirm('¿Consumir "Artes Ocultas"?');
      if (ok) {
        discardCard(card.id);
        drawHiddenCard(player);
        socket?.emit('card', { action: 'hiddenDraw', player, id: card.id });
      }
      return;
    }
    if (card.effectKey === 'noCaptureNextTurn') {
      const ok = await confirm('¿Usar "Tratado de paz"?');
      if (ok) {
        useChessStore.getState().activatePeaceTreaty(card.id, player);
      }
      return;
    }
    if (card.effectKey === 'undoTurn') {
      const ok = await confirm('¿Usar "DEJAVÚ"?');
      if (ok) {
        useChessStore.getState().useDejavu(card.id, player);

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

      <h4 className="card-title">{card.name}</h4>
      {showDescription && <p className="card-desc">{card.description}</p>}
      {showRarity && <small className="card-rarity">{card.rarity}</small>}

      {fullView && tooltip && (
        <div
          style={{
            position: 'fixed',
            top: tooltip.y + 8,
            left: tooltip.x + 8,

            backgroundColor: rarityColors[card.rarity],
            opacity: 0.85,
            padding: '0.5rem',
            borderRadius: 8,
            zIndex: 10000,
            maxWidth: 200,

            pointerEvents: 'none',
          }}
        >
          <p style={{ margin: 0 }}>{card.description}</p>
          <small style={{ display: 'block', marginTop: 4 }}>{card.rarity}</small>

        </div>
      )}
    </div>
  );
};

export default CardView;
