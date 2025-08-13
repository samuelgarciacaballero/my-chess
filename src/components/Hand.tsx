// src/components/Hand.tsx
import React, { useEffect } from 'react';
import { useCardStore } from '../stores/useCardStore';
import CardView from './Card';
import './Hand.css';

interface HandProps {
  player: 'w' | 'b';
  position: 'top' | 'bottom' | 'full';
  readOnly?: boolean;
}

const Hand: React.FC<HandProps> = ({ player, position, readOnly }) => {
  const hand = useCardStore((s) =>
    player === 'w' ? s.hand : s.opponentHand
  );
  const selectedCard = useCardStore((s) => s.selectedCard);
  const drawFn = useCardStore((s) =>
    player === 'w' ? s.drawCard : s.drawOpponentCard
  );
  const selectCard = useCardStore((s) => s.selectCard);

  // Roba la carta inicial solo si la mano está vacía
  useEffect(() => {
    if (hand.length === 0) {
      drawFn();
    }
  }, [drawFn, hand.length]);

  return (
    <div className={`hand ${position}`}>
      {hand.map((card) => (
        <CardView
          key={card.id}
          card={card}
          isSelected={!readOnly && selectedCard?.id === card.id}
          onSelect={readOnly ? undefined : selectCard}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
};

export default Hand;
