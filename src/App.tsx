// src/App.tsx
import React, { useEffect, useState } from "react";
import Board from "./components/Board";
import Hand from "./components/Hand";
import DevPanel from "./components/DevPanel";
import TurnIndicator from "./components/TurnIndicator";
import FaceUpCard from "./components/FaceUpCard";
import Notification from "./components/Notification";
import { useCardStore } from "./stores/useCardStore";
import { useChessStore } from "./stores/useChessStore";
import { useSettingsStore } from "./stores/useSettingsStore";
import { useOnlineStore } from "./stores/useOnlineStore";
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
  const connected = useOnlineStore((s) => s.connected);
  const connect = useOnlineStore((s) => s.connect);
  const playerColor = useOnlineStore((s) => s.color);
  const [room, setRoom] = useState("");
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

  if (!connected) {
    return (
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          padding: "1rem",
        }}
      >
        <h1>Magic Chess Online</h1>
        <input
          placeholder="Contraseña de sala"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />
        <button onClick={() => connect(room)}>Unirse</button>
      </div>
    );
  }

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

      <Hand
        player={
          connected
            ? playerColor === "w"
              ? "b"
              : "w"
            : localMultiplayer
              ? turn === "w"
                ? "b"
                : "w"
              : "b"
        }
        position="top"
        readOnly
      />

      <div className="board-area">
        <Board
          rotated={
            connected
              ? playerColor === "b"
              : localMultiplayer && turn === "b"
          }
        />
        {initialFaceUp && <FaceUpCard card={initialFaceUp} />}
      </div>
      <PromotionModal />
      <Hand
        player={connected ? playerColor ?? "w" : localMultiplayer ? turn : "w"}
        position="bottom"
      />
    </div>
  );
};

export default App;
