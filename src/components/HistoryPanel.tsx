import React from 'react';
import { useHistoryStore } from '../stores/useHistoryStore';

const HistoryPanel: React.FC = () => {
  const events = useHistoryStore(s => s.events);
  const viewIndex = useHistoryStore(s => s.viewIndex);
  const goTo = useHistoryStore(s => s.goTo);
  const prev = useHistoryStore(s => s.prev);
  const next = useHistoryStore(s => s.next);
  const backToCurrent = useHistoryStore(s => s.backToCurrent);

  return (
    <div>
      <div>
        {events.map((event, idx) => (
          <div key={idx} onClick={() => goTo(idx)}>
            {String(event)}
          </div>
        ))}
      </div>
      <div>
        <button onClick={prev}>Prev</button>
        <span>{viewIndex}</span>
        <button onClick={next}>Next</button>
        <button onClick={backToCurrent}>Current</button>
      </div>

    </div>
  );
};

export default HistoryPanel;
