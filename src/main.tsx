// src/main.tsx (o index.tsx)
import ReactDOM from 'react-dom/client';
import Root from './Root';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <DndProvider backend={HTML5Backend}>
    <Root />
  </DndProvider>
);
