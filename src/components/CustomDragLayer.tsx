// src/components/CustomDragLayer.tsx
import React from 'react';
import { useDragLayer } from 'react-dnd';
import { useChessStore } from '../stores/useChessStore';

const unicodeMap: Record<string, Record<'w' | 'b', string>> = {
  p: { w: '♙', b: '♟' },
  r: { w: '♖', b: '♜' },
  n: { w: '♘', b: '♞' },
  b: { w: '♗', b: '♝' },
  q: { w: '♕', b: '♛' },
  k: { w: '♔', b: '♚' },
};

const CustomDragLayer: React.FC = () => {
  const board = useChessStore(s => s.board);
  const { item, itemType, isDragging, currentOffset } = useDragLayer(monitor => ({
    item: monitor.getItem() as { row: number; col: number } | null,
    itemType: monitor.getItemType(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getClientOffset(),
  }));

  if (!isDragging || itemType !== 'piece' || !item || !currentOffset) {
    return null;
  }

  const piece = board[item.row][item.col];
  if (!piece) return null;
  const symbol = unicodeMap[piece.type][piece.color];
  const { x, y } = currentOffset;

  return (
    // 1) Contenedor fixed que cubre toda la pantalla
    <div
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 9999,
      }}
    >
      {/* 2) Vista previa absoluta centrada en (x,y) */}
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          transform: 'translate(-50%, -50%)',
          width: 'var(--square)',
          height: 'var(--square)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 'calc(var(--square) * 0.8)',
        }}
      >
        {symbol}
      </div>
    </div>
  );
};

export default CustomDragLayer;
