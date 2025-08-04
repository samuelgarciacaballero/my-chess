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
