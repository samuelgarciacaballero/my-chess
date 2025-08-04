// src/components/DevPanel.tsx
import React from 'react';
import { useCardStore } from '../stores/useCardStore';

const DevPanel: React.FC = () => {
  const deck = useCardStore(s => s.deck);
  const hand = useCardStore(s => s.hand);
  const opponentHand = useCardStore(s => s.opponentHand);
  const initialFaceUp = useCardStore(s => s.initialFaceUp);
  const selectedCard = useCardStore(s => s.selectedCard);

  const drawCard = useCardStore(s => s.drawCard);
  const drawOpponentCard = useCardStore(s => s.drawOpponentCard);
  const clearOpponentHand = useCardStore(s => s.clearOpponentHand);

  // Nuevas acciones dev:
  const drawSpecificToHand = useCardStore(s => s.drawSpecificToHand);
  const drawSpecificToOpponent = useCardStore(s => s.drawSpecificToOpponent);

  return (
    <div style={{
      border: '2px dashed #f00',
      padding: '1rem',
      margin: '1rem',
      backgroundColor: '#fee'
    }}>
      <h2>🔧 Dev Panel</h2>

      <button onClick={drawCard}>→ Robar carta jugador</button>{' '}
      <button onClick={drawOpponentCard}>→ Robar carta rival</button>{' '}
      <button onClick={clearOpponentHand}>× Vaciar mano rival</button>

      <h3>Mazo completo:</h3>
      {deck.map(card => (
        <div key={card.id} style={{ marginBottom: '0.25rem' }}>
          {card.id}
          <button onClick={() => drawSpecificToHand(card.id)} style={{ marginLeft: '0.5rem' }}>
            + Mi mano
          </button>
          <button onClick={() => drawSpecificToOpponent(card.id)} style={{ marginLeft: '0.25rem' }}>
            + Mano rival
          </button>
        </div>
      ))}

      <ul>
        <li><strong>Carta mesa:</strong> {initialFaceUp?.id ?? '–'}</li>
        <li><strong>Mi mano:</strong> {hand.map(c => c.id).join(', ') || '–'}</li>
        <li><strong>Mano rival:</strong> {opponentHand.map(c => c.id).join(', ') || '–'}</li>
        <li><strong>Seleccionada:</strong> {selectedCard?.id ?? '–'}</li>
      </ul>
    </div>
  );
};

export default DevPanel;
