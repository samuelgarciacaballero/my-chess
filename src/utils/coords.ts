// src/utils/coords.ts
const files = ['a','b','c','d','e','f','g','h'];

/**
 * Convierte row (0–7, donde 0 es rank 8) y col (0–7, donde 0 es file a)
 * en notación algebraica, p.e. (6,4) → "e2".
 */
export function toSquare(row: number, col: number): string {
  const file = files[col];
  const rank = 8 - row;
  return `${file}${rank}`;
}

/**
 * Convierte una notación algebraica (p.e. "e2") en sus índices de fila y
 * columna (0–7). La fila 0 corresponde al rango 8 y la columna 0 al file "a".
 */
export function fromSquare(square: string): { row: number; col: number } {
  const file = square[0];
  const rank = parseInt(square[1], 10);
  return { row: 8 - rank, col: files.indexOf(file) };
}
