// src/components/DevPanel.tsx
import React, { useEffect, useState } from 'react';
import { useCardStore } from '../stores/useCardStore';
import { useSettingsStore } from '../stores/useSettingsStore';

interface DevPanelProps {
  theme: 'light' | 'dark';
  setTheme: React.Dispatch<React.SetStateAction<'light' | 'dark'>>;
}

const DevPanel: React.FC<DevPanelProps> = ({ theme, setTheme }) => {
  const deck = useCardStore(s => s.deck);

  const clearOpponentHand = useCardStore(s => s.clearOpponentHand);

  // Nuevas acciones dev:
  const drawSpecificToHand = useCardStore(s => s.drawSpecificToHand);
  const drawSpecificToOpponent = useCardStore(s => s.drawSpecificToOpponent);

  const localMultiplayer = useSettingsStore(s => s.localMultiplayer);
  const toggleLocalMultiplayer = useSettingsStore(s => s.toggleLocalMultiplayer);
  const fullView = useSettingsStore(s => s.fullView);
  const toggleFullView = useSettingsStore(s => s.toggleFullView);
  const leftHanded = useSettingsStore(s => s.leftHanded);
  const toggleLeftHanded = useSettingsStore(s => s.toggleLeftHanded);

  const [cardToAdd, setCardToAdd] = useState(deck[0]?.id ?? '');
  const [targetPlayer, setTargetPlayer] = useState<'w' | 'b'>('w');
  const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleAddCard = () => {
    if (!cardToAdd) return;
    if (targetPlayer === 'w') {
      drawSpecificToHand(cardToAdd);
    } else {
      drawSpecificToOpponent(cardToAdd);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (['BUTTON', 'SELECT', 'OPTION'].includes(target.tagName)) return;
    setOffset({ x: e.clientX - position.x, y: e.clientY - position.y });
    setDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      setPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };
    const handleMouseUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, offset]);

  return (
    <div
      className="dev-panel"
      style={{ top: position.y, left: position.x, transform: 'translate(-50%, -50%)' }}
      onMouseDown={handleMouseDown}
    >
      <h2>🔧 Dev Panel</h2>

      <button onClick={clearOpponentHand}>× Vaciar mano rival</button>
      <button onClick={toggleLocalMultiplayer}>
        {localMultiplayer ? 'Desactivar modo 2 jugadores' : 'Activar modo 2 jugadores'}
      </button>
      <button onClick={toggleFullView}>
        {fullView ? 'Salir vista completa' : 'Vista completa'}
      </button>
      <button onClick={toggleLeftHanded}>
        {leftHanded ? 'Modo diestros' : 'Modo zurdos'}
      </button>
      <button onClick={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}>
        {theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro'}
      </button>

      <div className="add-card">
        <span>Añadir carta</span>
        <select
          className="form-select"
          value={cardToAdd}
          onChange={e => setCardToAdd(e.target.value)}
        >
          {deck.map(card => (
            <option key={card.id} value={card.id}>
              {card.name}
            </option>
          ))}
        </select>
        <span>al jugador</span>
        <select
          className="form-select"
          value={targetPlayer}
          onChange={e => setTargetPlayer(e.target.value as 'w' | 'b')}
        >
          <option value="w">blanco</option>
          <option value="b">negro</option>
        </select>
        <button onClick={handleAddCard}>Añadir</button>
      </div>
    </div>
  );
};

export default DevPanel;
