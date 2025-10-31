import MessageCreation from './components/MessageCreation';
import MessageList from './components/MessageList';
import MemberDashboard from './components/MemberDashboard';
import AutoResponseList from './components/AutoResponseList';
import { NavigationProvider, useNavigation } from './contexts/NavigationContext';

function AppContent() {
  const { currentView } = useNavigation();

  if (currentView === 'messageCreation') {
    return <MessageCreation />;
  }

  if (currentView === 'members') {
    return <MemberDashboard />;
  }

  if (currentView === 'autoResponse') {
    return <AutoResponseList />;
  }

  return <MessageList />;
}

export default function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}
