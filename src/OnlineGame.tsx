import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Color, Square } from 'chess.js';
import App from './App';
import { useChessStore } from './stores/useChessStore';
import { useCardStore } from './stores/useCardStore';

const SERVER_URL = 'http://localhost:3001';

const OnlineGame: React.FC = () => {
  const [phase, setPhase] = useState<'login' | 'waiting' | 'playing'>('login');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [color, setColor] = useState<Color>('w');

  useEffect(() => {
    if (!socket) return;

    const onWaiting = () => setPhase('waiting');
    const onStart = ({ color: c, seed }: { color: Color; seed: number }) => {
      setColor(c);
      useChessStore.getState().reset();
      const cardState = useCardStore.getState();
      cardState.reset(seed);
      cardState.setInitialFaceUp();
      useChessStore.getState().setOnline(socket, c);
      setPhase('playing');
    };
    const onMove = ({ from, to, effectKey }: { from: Square; to: Square; effectKey?: string }) => {
      useChessStore.getState().move(from, to, effectKey, true);
    };
    const onCard = (data: { action: string; player: Color; id?: string }) => {
      const cs = useCardStore.getState();
      if (data.action === 'hiddenDraw') {
        if (data.id) cs.discardCard(data.id);
        cs.drawHiddenCard(data.player);
      } else if (data.action === 'discard' && data.id) {
        cs.discardCard(data.id);
      }
    };

    socket.on('waiting', onWaiting);
    socket.on('start', onStart);
    socket.on('move', onMove);
    socket.on('card', onCard);

    return () => {
      socket.off('waiting', onWaiting);
      socket.off('start', onStart);
      socket.off('move', onMove);
      socket.off('card', onCard);
    };
  }, [socket]);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
        useChessStore.getState().setOnline(null, null);
      }
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = io(SERVER_URL);
    setSocket(s);
    setPhase('waiting');
    useChessStore.getState().reset();
    useCardStore.getState().reset();
    s.emit('join', { room: password, name });
  };

  if (phase === 'login') {
    return (
      <div style={{ textAlign: 'center' }}>
        <h2>Juego en línea</h2>
        <form onSubmit={handleSubmit} style={{ display: 'inline-block' }}>
          <div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              required
            />
          </div>
          <div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
            />
          </div>
          <button type="submit">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <App playerColor={color} />
      {phase === 'waiting' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            color: 'white',
            fontSize: '1.5rem',
          }}
        >
          Esperando otro jugador...
        </div>
      )}
    </div>
  );
};

export default OnlineGame;
