import { useState } from 'react';
import MessageCreation from './components/MessageCreation';
import MessageList from './components/MessageList';
import MemberDashboard from './components/MemberDashboard';

type ViewState = 'messages' | 'messageCreation' | 'members';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('messages');

  if (currentView === 'messageCreation') {
    return <MessageCreation onBack={() => setCurrentView('messages')} />;
  }

  if (currentView === 'members') {
    return (
      <MemberDashboard
        onShowMessages={() => setCurrentView('messages')}
        onShowMembers={() => setCurrentView('members')}
      />
    );
  }

  return (
    <MessageList
      onCreateMessage={() => setCurrentView('messageCreation')}
      onShowMessages={() => setCurrentView('messages')}
      onShowMembers={() => setCurrentView('members')}
    />
  );
}
