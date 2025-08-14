import React from 'react';
import { useConfirmStore } from '../stores/useConfirmStore';

const ConfirmModal: React.FC = () => {
  const { message, resolve, hide } = useConfirmStore();

  if (!message) return null;

  const handle = (val: boolean) => () => {
    resolve?.(val);
    hide();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.3)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          border: '2px dashed #f00',
          padding: '1rem',
          background: 'rgba(97,97,100,0.85)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0 }}>{message}</p>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary" onClick={handle(false)}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handle(true)}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
