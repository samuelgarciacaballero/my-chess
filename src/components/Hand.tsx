// src/components/Hand.tsx
import React from 'react';
import { useCardStore } from '../stores/useCardStore';
import CardView from './Card';
import './Hand.css';

interface HandProps {
  player: 'w' | 'b';
  position: 'top' | 'bottom' | 'full-top' | 'full-bottom';
  readOnly?: boolean;
}

const Hand: React.FC<HandProps> = ({ player, position, readOnly }) => {
  const hand = useCardStore((s) =>
    player === 'w' ? s.hand : s.opponentHand
  );
  const selectedCard = useCardStore((s) => s.selectedCard);
  const selectCard = useCardStore((s) => s.selectCard);
  // No se roba automáticamente al descartar

  return (
    <div className={`hand ${position}`}>
      {hand.map((card) => (
        <CardView
          key={card.id}
          card={card}
          isSelected={!readOnly && selectedCard?.id === card.id}
          onSelect={readOnly ? undefined : selectCard}
          readOnly={readOnly}
          showRarity={
            position !== 'full-top' && position !== 'full-bottom'
          }
          showDescription={
            position !== 'full-top' && position !== 'full-bottom'
          }
          player={player}
          faceDown={readOnly && card.hidden}
          fullView={position === 'full-top' || position === 'full-bottom'}
        />
      ))}
    </div>
  );
};

export default Hand;
