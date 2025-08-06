// src/components/Hand.tsx
import React, { useEffect } from 'react';
import { useCardStore } from '../stores/useCardStore';
import CardView from './Card';
import './Hand.css';

interface HandProps {
  player: 'w' | 'b';
  position: 'top' | 'bottom';
  faceDown?: boolean;
}

const Hand: React.FC<HandProps> = ({ player, position, faceDown }) => {
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
      {faceDown
        ? hand.map((c) => (
            <div key={c.id} className="card back">🂠</div>
          ))
        : hand.map((card) => (
            <CardView
              key={card.id}
              card={card}
              isSelected={selectedCard?.id === card.id}
              onSelect={selectCard}
            />
          ))}
    </div>
  );
};

export default Hand;
