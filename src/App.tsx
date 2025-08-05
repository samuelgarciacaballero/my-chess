import React, { useEffect } from 'react';
import Board from './components/Board';
import Hand from './components/Hand';
import DevPanel from './components/DevPanel';
import TurnIndicator from './components/TurnIndicator';
import { useCardStore } from './stores/useCardStore';
// import type { Card } from './stores/useCardStore';

const App: React.FC = () => {
  const setInitialFaceUp = useCardStore(s => s.setInitialFaceUp);
  const [devMode, setDevMode] = React.useState(false);

  useEffect(() => { setInitialFaceUp(); }, [setInitialFaceUp]);

  return (
    <div>
      <h1 style={{ textAlign: 'center' }}>My Chess MVP</h1>
      <button onClick={() => setDevMode(d => !d)}>
        {devMode ? '🔒 Salir Dev Mode' : '🔧 Entrar Dev Mode'}
      </button>
      {devMode && <DevPanel />}

      <TurnIndicator />

      <Board />
      <Hand />
    </div>
  );
};

export default App;
