// src/App.tsx
import React, { useEffect, useState } from "react";
import Board from "./components/Board";
import Hand from "./components/Hand";
import DevPanel from "./components/DevPanel";
import TurnIndicator from "./components/TurnIndicator";
import FaceUpCard from "./components/FaceUpCard";
import Notification from "./components/Notification";
import { useCardStore } from "./stores/useCardStore";
// import type { Card } from "./stores/useCardStore";

const App: React.FC = () => {
  const initialFaceUp = useCardStore(s => s.initialFaceUp);
  const setInitialFaceUp = useCardStore(s => s.setInitialFaceUp);
  const [devMode, setDevMode] = useState(false);

  useEffect(() => {
    setInitialFaceUp();
  }, [setInitialFaceUp]);

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "1rem", position: "relative" }}>
      {/* Notificaciones flotantes */}
      <Notification />

      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>My Chess MVP</h1>
        <button onClick={() => setDevMode(d => !d)}>
          {devMode ? "🔒 Salir Dev Mode" : "🔧 Entrar Dev Mode"}
        </button>
      </header>

      {devMode && <DevPanel />}

      <TurnIndicator />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Board />
        {initialFaceUp && <FaceUpCard card={initialFaceUp} />}
      </div>

      <Hand />
    </div>
  );
};

export default App;
