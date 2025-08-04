import React, { useState, useEffect } from 'react';
import Board from './components/Board';
import Hand from './components/Hand';
import DevPanel from './components/DevPanel';
import { useCardStore } from './stores/useCardStore';
import type { Card } from './stores/useCardStore';

const FaceUpCard: React.FC<{ card: Card }> = ({ card }) => (
  <div
    style={{
      border: '2px solid purple',
      borderRadius: '8px',
      padding: '1rem',
      margin: '0 auto 1rem',
      width: '200px',
      textAlign: 'center',
      backgroundColor: '#faf',
    }}
  >
    <h3 style={{ margin: '0 0 0.5rem' }}>Carta en mesa</h3>
    <strong>{card.name}</strong>
    <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>{card.description}</p>
    <small>Rarity: {card.rarity}</small>
  </div>
);

const App: React.FC = () => {
  const [devMode, setDevMode] = useState(false);
  const initialFaceUp = useCardStore(s => s.initialFaceUp);
  const setInitialFaceUp = useCardStore(s => s.setInitialFaceUp);

  useEffect(() => {
    setInitialFaceUp();
  }, [setInitialFaceUp]);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>My Chess MVP</h1>
      <button onClick={() => setDevMode(m => !m)}>
        {devMode ? '🔒 Salir Dev Mode' : '🔧 Entrar Dev Mode'}
      </button>
      {devMode && <DevPanel />}

      {initialFaceUp && <FaceUpCard card={initialFaceUp} />}
      <Board />
      <Hand />
    </div>
  );
};

export default App;
