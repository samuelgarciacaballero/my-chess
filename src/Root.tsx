import React, { useState } from 'react';
import App from './App';
import OnlineGame from './OnlineGame';

const Root: React.FC = () => {
  const [mode, setMode] = useState<'start' | 'single' | 'online'>('start');

  if (mode === 'single') {
    return <App />;
  }
  if (mode === 'online') {
    return <OnlineGame />;
  }
  return (
    <div style={{ textAlign: 'center', padding: '2rem' }}>
      <h2>Magic Chess</h2>
      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={() => setMode('single')}
          style={{ margin: '0.5rem', padding: '0.5rem 1rem' }}
        >
          Un jugador
        </button>
        <button
          onClick={() => setMode('online')}
          style={{ margin: '0.5rem', padding: '0.5rem 1rem' }}
        >
          Dos jugadores
        </button>
      </div>
    </div>
  );
};

export default Root;
