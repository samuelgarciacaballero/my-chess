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

function getItemStyles(currentOffset: { x: number; y: number } | null) {
  if (!currentOffset) {
    return { display: 'none' } as React.CSSProperties;
  }
  const { x, y } = currentOffset;
  const transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
  return {
    transform,
    WebkitTransform: transform,
  } as React.CSSProperties;
}

const CustomDragLayer: React.FC = () => {
  const board = useChessStore((s) => s.board);
  const { itemType, isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as { row: number; col: number } | null,
    itemType: monitor.getItemType(),
    currentOffset: monitor.getClientOffset(),
    isDragging: monitor.isDragging(),
  }));

  if (!isDragging || itemType !== 'piece' || !item || !currentOffset) {
    return null;
  }

  const piece = board[item.row][item.col];
  if (!piece) return null;
  const symbol = unicodeMap[piece.type][piece.color];

  const styles: React.CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    width: 'var(--square)',
    height: 'var(--square)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'calc(var(--square) * 0.8)',
    ...getItemStyles(currentOffset),
  };

  return <div style={styles}>{symbol}</div>;
};

export default CustomDragLayer;
