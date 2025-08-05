// src/components/Hand.tsx
import React, { useEffect } from 'react';
import { useCardStore } from '../stores/useCardStore';
import CardView from './Card';
import './Hand.css';

const Hand: React.FC = () => {
  const hand = useCardStore(state => state.hand);
  const selectedCard = useCardStore(state => state.selectedCard);
  const drawCard = useCardStore(state => state.drawCard);
  const selectCard = useCardStore(state => state.selectCard);

  // Al montar el componente, robamos la carta inicial si procede
  useEffect(() => {
    // En este store ahora drawCard no necesita parámetro
    drawCard();
  }, [drawCard]);

  return (
    <div className="hand">
      {hand.map((card) => (
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
