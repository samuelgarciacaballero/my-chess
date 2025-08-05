// src/components/PromotionModal.tsx
import { useChessStore } from "../stores/useChessStore";
import type { PieceSymbol } from "chess.js";
import "./PromotionModal.css";

// Iconos Unicode solo para las piezas de promoción
const ICONS: Partial<Record<PieceSymbol, string>> = {
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
};

const OPTIONS: PieceSymbol[] = ["q", "r", "b", "n"];

export default function PromotionModal() {
  const { promotionRequest, selectPromotion } = useChessStore();
  if (!promotionRequest) return null;

  return (
    <div className="promo-overlay">
      <div className="promo-box">
        <h3>Promoción de peón</h3>
        <div className="promo-options">
          {OPTIONS.map((p) => (
            <button
              key={p}
              className={`promo-btn promo-${p}`}
              onClick={() => selectPromotion(p)}
            >
              {ICONS[p]!}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
