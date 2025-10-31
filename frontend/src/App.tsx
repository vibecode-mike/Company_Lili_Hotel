import { useState } from 'react';
import MessageCreation from './components/MessageCreation';
import MessageList from './components/MessageList';
import MemberDashboard from './components/MemberDashboard';
import AutoResponseList from './components/AutoResponseList';

type ViewState = 'messages' | 'messageCreation' | 'members' | 'autoResponse';

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
        onShowAutoResponse={() => setCurrentView('autoResponse')}
      />
    );
  }

  if (currentView === 'autoResponse') {
    return (
      <AutoResponseList
        onBack={() => setCurrentView('messages')}
        onShowMessages={() => setCurrentView('messages')}
        onShowAutoResponse={() => setCurrentView('autoResponse')}
        onShowMembers={() => setCurrentView('members')}
      />
    );
  }

  return (
    <MessageList
      onCreateMessage={() => setCurrentView('messageCreation')}
      onShowMessages={() => setCurrentView('messages')}
      onShowMembers={() => setCurrentView('members')}
      onShowAutoResponse={() => setCurrentView('autoResponse')}
    />
  );
}
