import { createContext, useContext, useState, ReactNode } from 'react';

export type ViewState = 'messages' | 'messageCreation' | 'members' | 'autoResponse';

interface NavigationContextType {
  currentView: ViewState;
  navigate: (view: ViewState) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const [currentView, setCurrentView] = useState<ViewState>('messages');

  const navigate = (view: ViewState) => {
    setCurrentView(view);
  };

  return (
    <NavigationContext.Provider value={{ currentView, navigate }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
