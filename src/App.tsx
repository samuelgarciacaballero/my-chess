// src/App.tsx
import React, { useEffect, useState } from "react";
import Board from "./components/Board";
import Hand from "./components/Hand";
import DevPanel from "./components/DevPanel";
import TurnIndicator from "./components/TurnIndicator";
import FaceUpCard from "./components/FaceUpCard";
import Notification from "./components/Notification";
import DeckPile from "./components/DeckPile";
import Graveyard from "./components/Graveyard";
import { useCardStore } from "./stores/useCardStore";
import { useChessStore } from "./stores/useChessStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import PromotionModal from "./components/PromotionModal";
import CustomDragLayer from "./components/CustomDragLayer";
import "./App.css";
// import { WHITE } from "chess.js";

// import type { Card } from "./stores/useCardStore";

const App: React.FC = () => {
  const initialFaceUp = useCardStore((s) => s.initialFaceUp);
  const setInitialFaceUp = useCardStore((s) => s.setInitialFaceUp);
  const turn = useChessStore((s) => s.turn);
  const localMultiplayer = useSettingsStore((s) => s.localMultiplayer);
  const fullView = useSettingsStore((s) => s.fullView);
  const [devMode, setDevMode] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light",
  );

  useEffect(() => {
    setInitialFaceUp();
  }, [setInitialFaceUp]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "1rem",
        position: "relative",
      }}
    >
      {/* Notificaciones flotantes y capa de arrastre personalizada */}
      <Notification />
      <CustomDragLayer />

      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Magic Chess</h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "☀️ Claro" : "🌙 Oscuro"}
          </button>
          <button onClick={() => setDevMode((d) => !d)}>
            {devMode ? "🔒 Salir Dev Mode" : "🔧 Entrar Dev Mode"}
          </button>
        </div>
      </header>

      {devMode && <DevPanel />}

      <TurnIndicator />

      {!fullView && (
        <Hand
          player={localMultiplayer ? (turn === "w" ? "b" : "w") : "b"}
          position="top"
          readOnly
        />
      )}

      <div className="board-area">
        {!fullView && initialFaceUp && (
          <div className="initial-card">
            <FaceUpCard card={initialFaceUp} />
          </div>
        )}
        {fullView && (
          <div className="left-panel">
            <Hand
              player={localMultiplayer ? (turn === "w" ? "b" : "w") : "b"}
              position="full"
              readOnly
            />
            {initialFaceUp && <FaceUpCard card={initialFaceUp} small />}
            <Hand
              player={localMultiplayer ? turn : "w"}
              position="full"
            />
          </div>
        )}
        <Board rotated={localMultiplayer && turn === "b"} />
        <div className="side-piles">
          <DeckPile />
          <Graveyard />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          margin: "1rem 0",
        }}
      >
        <DeckPile />
        <Graveyard />
      </div>
      <PromotionModal />
      {!fullView && (
        <Hand
          player={localMultiplayer ? turn : "w"}
          position="bottom"
        />
      )}
    </div>
  );
};

export default App;
