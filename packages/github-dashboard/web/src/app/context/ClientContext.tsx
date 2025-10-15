import React, { createContext, ReactNode, useContext } from 'react';

import { useClientData } from '../hooks/useClientData';

interface Feature {
  id: string;
  code: string;
  name: string;
}

interface Client {
  id: string;
  name: string;
  logoUrl?: string;
  tierTypeByTierTypeId?: {
    id: string;
    code: string;
    name: string;
    tierTypeFeaturesByTierTypeId?: {
      nodes: Array<{
        featureByFeatureId: Feature;
      }>;
    };
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
  hasFeature: (featureCode: string) => boolean;
  getFeatures: () => Feature[];
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

  // Helper function to check if client has a specific feature
  const hasFeature = (featureCode: string): boolean => {
    if (!clientData.activeClient?.tierTypeByTierTypeId?.tierTypeFeaturesByTierTypeId?.nodes) {
      return false;
    }
    
    return clientData.activeClient.tierTypeByTierTypeId.tierTypeFeaturesByTierTypeId.nodes
      .some(tierFeature => tierFeature.featureByFeatureId.code === featureCode);
  };

  // Helper function to get all features for the active client
  const getFeatures = (): Feature[] => {
    if (!clientData.activeClient?.tierTypeByTierTypeId?.tierTypeFeaturesByTierTypeId?.nodes) {
      return [];
    }
    
    return clientData.activeClient.tierTypeByTierTypeId.tierTypeFeaturesByTierTypeId.nodes
      .map(tierFeature => tierFeature.featureByFeatureId);
  };

  const contextValue: ClientContextType = {
    ...clientData,
    isPremium,
    hasFeature,
    getFeatures,
  };

  return (
    <ClientContext.Provider value={contextValue}>
      {children}
    </ClientContext.Provider>
  ) as React.ReactElement;
}

export function useClientContext(): ClientContextType {
  const context = useContext(ClientContext);
  if (context === undefined) {
    throw new Error('useClientContext must be used within a ClientProvider');
  }
  return context;
}
