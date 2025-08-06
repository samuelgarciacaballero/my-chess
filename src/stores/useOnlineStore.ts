import { create } from "zustand";
import type { Color, Square } from "chess.js";

interface OnlineState {
  socket: WebSocket | null;
  room: string;
  color: Color | null;
  connected: boolean;
  connect: (room: string) => void;
}

export const useOnlineStore = create<OnlineState>((set) => ({
  socket: null,
  room: "",
  color: null,
  connected: false,
  connect: (room: string) => {
    const socket = new WebSocket(`ws://${window.location.hostname}:8080`);
    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "join", room }));
    };
    socket.onmessage = (ev) => {
      const msg = JSON.parse(ev.data);
      if (msg.type === "joined") {
        set({ connected: true, room, color: msg.color as Color, socket });
      } else if (msg.type === "move") {
        import("./useChessStore").then(({ useChessStore }) => {
          if (msg.promotion) {
            useChessStore.getState().selectPromotion(msg.promotion);
          } else {
            useChessStore
              .getState()
              .move(
                msg.from as Square,
                msg.to as Square,
                msg.effectKey,
                true,
              );
          }
        });
      }
    };
    set({ socket, room });
  },
}));
