// src/components/Notification.tsx
import React, { useEffect } from "react";
import { useChessStore } from "../stores/useChessStore";
import "./Notification.css";

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
  return <div className="notification">{notification}</div>;
};

export default Notification;
