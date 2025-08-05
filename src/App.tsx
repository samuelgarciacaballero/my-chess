// src/App.tsx
import React, { useEffect, useState } from 'react';
import Board from './components/Board';
import Hand from './components/Hand';
import DevPanel from './components/DevPanel';
import TurnIndicator from './components/TurnIndicator';
import FaceUpCard from './components/FaceUpCard';
import { useCardStore } from './stores/useCardStore';
// import type { Card } from './stores/useCardStore';

const App: React.FC = () => {
  const initialFaceUp = useCardStore(s => s.initialFaceUp);
  const setInitialFaceUp = useCardStore(s => s.setInitialFaceUp);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    setInitialFaceUp();
  }, [setInitialFaceUp]);

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <header
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h1 style={{ margin: 0, textAlign: 'center', flex: 1 }}>
          My Chess MVP
        </h1>
        <button onClick={() => setDevMode(d => !d)}>
          {devMode ? '🔒 Salir Dev Mode' : '🔧 Entrar Dev Mode'}
        </button>
      </header>

      {devMode && (
        <div style={{ width: '100%' }}>
          <DevPanel />
        </div>
      )}

      <TurnIndicator />

      <div
        style={{
          display: 'flex',
          width: '100%',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '1rem',
        }}
      >
        <Board />
        {initialFaceUp && <FaceUpCard card={initialFaceUp} />}
      </div>

      <div style={{ width: '100%' }}>
        <Hand />
      </div>
    </div>
  );
};

export default App;
