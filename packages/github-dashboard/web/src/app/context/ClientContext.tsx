import React, { createContext, ReactNode, useContext } from 'react';

import { useClientData } from '../hooks/useClientData';

interface Client {
  id: string;
  name: string;
  logoUrl?: string;
  tierTypeByTierTypeId?: {
    id: string;
    code: string;
    name: string;
  };
}

interface ClientContextType {
  clients: Client[];
  activeClient: Client | null;
  activeClientId: string | null;
  isPremium: boolean;
  loading: boolean;
  error: string | null;
  setActiveClientId: (clientId: string) => void;
}

const ClientContext = createContext<ClientContextType | undefined>(undefined);

interface ClientProviderProps {
  children: ReactNode;
}

export function ClientProvider({ children }: ClientProviderProps): React.ReactElement {
  // Use real data from GraphQL
  const clientData = useClientData();
  
  // Compute isPremium from active client's tier type
  const isPremium = clientData.activeClient?.tierTypeByTierTypeId?.code === 'premium';

  const contextValue: ClientContextType = {
    ...clientData,
    isPremium,
  };

  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  );
}

export function useClientContext(): ClientContextType {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
}
