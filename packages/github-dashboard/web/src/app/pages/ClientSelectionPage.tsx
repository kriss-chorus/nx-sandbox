import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container } from '@mui/material';
import { useClientData } from '../hooks/useClientData';
import { ClientCard } from '../components/client/ClientCard';
import { LoadingState } from '../components/common/LoadingState';
import { ErrorState } from '../components/common/ErrorState';

export const ClientSelectionPage: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const { clients, loading, error } = useClientData();

  const handleClientSelect = (clientId: string) => {
    localStorage.setItem('activeClientId', clientId);
    navigate('/dashboards');
  };

  if (loading) {
    return <LoadingState message="Loading clients..." />;
  }

  if (error) {
    return <ErrorState message={`Error loading clients: ${error}`} />;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom fontWeight="bold">
          Welcome to GitHub Dashboard
        </Typography>
        <Typography variant="h5" color="text.secondary" mb={4}>
          Choose your client experience to get started
        </Typography>
      </Box>

      <Box display="flex" justifyContent="center" gap={4} flexWrap="wrap">
        {clients.map((client) => {
          const isPremium = client.tierTypeByTierTypeId?.code === 'premium';

          return (
            <ClientCard
              key={client.id}
              name={client.name}
              logoUrl={client.logoUrl}
              tierName={client.tierTypeByTierTypeId?.name}
              isPremium={isPremium}
              onClick={() => handleClientSelect(client.id)}
              buttonLabel={`Select ${client.name}`}
            />
          );
        })}
      </Box>
    </Container>
  );
};
