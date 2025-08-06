import React, { useState } from "react";
import { useHistoryStore } from "../stores/useHistoryStore";
import type { Card } from "../stores/useCardStore";
import { rarityColors } from "../styles/cardColors";
import "./HistoryPanel.css";

const HistoryPanel: React.FC = () => {
  const { events, viewIndex, goTo, prev, next, backToCurrent } =
    useHistoryStore((s) => ({
      events: s.events,
      viewIndex: s.viewIndex,
      goTo: s.goTo,
      prev: s.prev,
      next: s.next,
      backToCurrent: s.backToCurrent,
    }));

  const [hover, setHover] = useState<{
    card: Card;
    x: number;
    y: number;
  } | null>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (hover) setHover({ card: hover.card, x: e.clientX, y: e.clientY });
  };

  return (
    <div className="history-panel">
      <ul>
        {events.map((ev, idx) => (
          <li
            key={idx}
            className={idx === viewIndex ? "active" : ""}
            onClick={() => goTo(idx)}
            onMouseMove={handleMouseMove}
            onMouseEnter={(e) => {
              if (ev.kind === "card")
                setHover({ card: ev.card, x: e.clientX, y: e.clientY });
            }}
            onMouseLeave={() => setHover(null)}
          >
            {ev.kind === "move"
              ? `${idx + 1}. ${ev.color === "w" ? "Blancas" : "Negras"}: ${
                  ev.san
                }`
              : `${idx + 1}. ${ev.color === "w" ? "Blancas" : "Negras"} juega ${
                  ev.card.name
                }`}
          </li>
        ))}
      </ul>
      <div className="history-buttons">
        <button onClick={prev}>Anterior</button>
        <button onClick={next}>Siguiente</button>
        <button onClick={backToCurrent}>Actual</button>
      </div>
      {hover && (
        <div
          className="card-tooltip"
          style={{
            left: hover.x + 10,
            top: hover.y + 10,
            backgroundColor: rarityColors[hover.card.rarity],
          }}
        >
          <h4>{hover.card.name}</h4>
          <p>{hover.card.description}</p>
          <small>Rarity: {hover.card.rarity}</small>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
