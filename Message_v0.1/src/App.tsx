import { useState } from 'react';
import MessageList from './components/MessageList';
import MessageCreation from './components/MessageCreation';

export default function App() {
  const [currentView, setCurrentView] = useState<'list' | 'creation'>('list');

  return (
    <>
      {currentView === 'list' ? (
        <MessageList onCreateMessage={() => setCurrentView('creation')} />
      ) : (
        <MessageCreation onBack={() => setCurrentView('list')} />
      )}
    </>
  );
}
