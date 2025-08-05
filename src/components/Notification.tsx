// src/components/Notification.tsx
import React, { useEffect } from "react";
import { useChessStore } from "../stores/useChessStore";

const Notification: React.FC = () => {
  const notification = useChessStore(s => s.notification);
  const clear = useChessStore(s => s.clearNotification);

  useEffect(() => {
    if (notification) {
      const id = window.setTimeout(() => clear(), 3000);
      return () => window.clearTimeout(id);
    }
  }, [notification, clear]);

  if (!notification) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: "1rem",
        left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: "rgba(0,0,0,0.8)",
        color: "white",
        padding: "0.75rem 1.5rem",
        borderRadius: "4px",
        zIndex: 1000,
        boxShadow: "0 2px 6px rgba(0,0,0,0.5)"
      }}
    >
      {notification}
    </div>
  );
};

export default Notification;
