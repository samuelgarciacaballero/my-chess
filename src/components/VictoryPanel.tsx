// src/components/VictoryPanel.tsx
import React, { useEffect, useState } from 'react';
import { useChessStore } from '../stores/useChessStore';
import { useCardStore } from '../stores/useCardStore';


const VictoryPanel: React.FC = () => {
  const winner = useChessStore((s) => s.winner);
  const reset = useChessStore((s) => s.reset);
  const cardReset = useCardStore((s) => s.reset);
  const setInitialFaceUp = useCardStore((s) => s.setInitialFaceUp);

  const [position, setPosition] = useState({
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
  });
  const [dragging, setDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON') return;
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

  if (!winner) return null;

  const text =
    winner === 'draw'
      ? '¡Tablas!'
      : winner === 'w'
      ? '¡Ganan las blancas!'
      : '¡Ganan las negras!';

  return (
    <div
      className="victory-panel"
      style={{ top: position.y, left: position.x, transform: 'translate(-50%, -50%)' }}
      onMouseDown={handleMouseDown}
    >
      <h2>{text}</h2>
      <button
        onClick={() => {
          cardReset();
          setInitialFaceUp();
          reset();
        }}
      >
        Reiniciar
      </button>

    </div>
  );
};

export default VictoryPanel;
