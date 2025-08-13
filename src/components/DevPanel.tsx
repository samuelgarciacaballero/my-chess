// src/components/DevPanel.tsx
import React, { useState } from 'react';
import { useCardStore } from '../stores/useCardStore';
import { useSettingsStore } from '../stores/useSettingsStore';

interface DevPanelProps {
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

const DevPanel: React.FC<DevPanelProps> = ({ theme, setTheme }) => {
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

  const localMultiplayer = useSettingsStore(s => s.localMultiplayer);
  const toggleLocalMultiplayer = useSettingsStore(s => s.toggleLocalMultiplayer);
  const fullView = useSettingsStore(s => s.fullView);
  const toggleFullView = useSettingsStore(s => s.toggleFullView);

  const [cardToAdd, setCardToAdd] = useState(deck[0]?.id ?? '');
  const [targetPlayer, setTargetPlayer] = useState<'w' | 'b'>('w');

  const handleAddCard = () => {
    if (!cardToAdd) return;
    if (targetPlayer === 'w') {
      drawSpecificToHand(cardToAdd);
    } else {
      drawSpecificToOpponent(cardToAdd);
    }
  };

  return (
    <div className="dev-panel">
      <h2>🔧 Dev Panel</h2>

      <button onClick={drawCard}>→ Robar carta jugador</button>{' '}
      <button onClick={drawOpponentCard}>→ Robar carta rival</button>{' '}
      <button onClick={clearOpponentHand}>× Vaciar mano rival</button>{' '}
      <button onClick={toggleLocalMultiplayer}>
        {localMultiplayer ? 'Desactivar modo 2 jugadores' : 'Activar modo 2 jugadores'}
      </button>
      <button onClick={toggleFullView}>
        {fullView ? 'Salir vista completa' : 'Vista completa'}
      </button>{' '}
      <button onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}>
        {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
      </button>

      <div style={{ marginTop: '0.5rem' }}>
        Añadir carta{' '}
        <select value={cardToAdd} onChange={e => setCardToAdd(e.target.value)}>
          {deck.map(card => (
            <option key={card.id} value={card.id}>
              {card.name}
            </option>
          ))}
        </select>{' '}
        al jugador{' '}
        <select
          value={targetPlayer}
          onChange={e => setTargetPlayer(e.target.value as 'w' | 'b')}
        >
          <option value="w">blanco</option>
          <option value="b">negro</option>
        </select>{' '}
        <button onClick={handleAddCard}>Añadir</button>
      </div>

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
