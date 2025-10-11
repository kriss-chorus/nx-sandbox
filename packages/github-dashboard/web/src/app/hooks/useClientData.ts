import { useState, useEffect } from 'react';

import { executeGraphQL } from '../api/postgraphile-client';

interface Client {
  id: string;
  name: string;
  tierTypeByTierTypeId: {
    id: string;
    code: string;
    name: string;
  };
  logoUrl?: string;
}

interface ClientData {
  clients: Client[];
  activeClientId: string | null;
  activeClient: Client | null;
  loading: boolean;
  error: string | null;
}

const CLIENTS_QUERY = `
  query GetClients {
    allClients {
      nodes {
        id
        name
        logoUrl
        tierTypeByTierTypeId {
          id
          code
          name
        }
      }
    }
  }
`;

export function useClientData(): ClientData & {
  setActiveClientId: (clientId: string) => void;
} {
  const [clients, setClients] = useState<Client[]>([]);
  const [activeClientId, setActiveClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await executeGraphQL<{
          allClients: { nodes: Client[] };
        }>(CLIENTS_QUERY);
        
        if (response.errors) {
          throw new Error(response.errors[0].message);
        }
        
        const clientsData = response.data?.allClients.nodes || [];
        setClients(clientsData);
        
        // Set default active client (first one, or from localStorage)
        const savedClientId = localStorage.getItem('activeClientId');
        if (savedClientId && clientsData.find((c: Client) => c.id === savedClientId)) {
          setActiveClientId(savedClientId);
        } else if (clientsData.length > 0) {
          setActiveClientId(clientsData[0].id);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  // Save active client to localStorage when it changes
  useEffect(() => {
    if (activeClientId) {
      localStorage.setItem('activeClientId', activeClientId);
    }
  }, [activeClientId]);

  const activeClient = clients.find(c => c.id === activeClientId) || null;

  return {
    clients,
    activeClientId,
    activeClient,
    loading,
    error,
    setActiveClientId,
  };
}
