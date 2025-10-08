import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Business, Star } from '@mui/icons-material';
import styled from '@emotion/styled';
import { useClientData } from '../hooks/useClientData';

const ClientCard = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isPremium',
})<{ isPremium: boolean }>`
  cursor: pointer;
  padding: 32px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-width: 300px;
  transition: all 0.3s ease-in-out;
  background: ${({ isPremium }) =>
    isPremium
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      : 'linear-gradient(135deg, #ff8c00 0%, #ff6b35 100%)'};
  color: white;
  border: 2px solid transparent;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    border-color: ${({ isPremium }) => (isPremium ? '#667eea' : '#ff8c00')};
  }
`;

const ClientIcon = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isPremium',
})<{ isPremium: boolean }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
`;

export const ClientSelectionPage: React.FC = (): React.ReactElement => {
  const navigate = useNavigate();
  const { clients, loading, error } = useClientData();

  const handleClientSelect = (clientId: string) => {
    // Store the selected client in localStorage
    localStorage.setItem('activeClientId', clientId);
    // Navigate to dashboards page
    navigate('/dashboards');
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" gutterBottom>
          Loading clients...
        </Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Typography variant="h4" align="center" color="error" gutterBottom>
          Error loading clients: {error}
        </Typography>
      </Container>
    );
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
              isPremium={isPremium}
              elevation={3}
              onClick={() => handleClientSelect(client.id)}
            >
              <ClientIcon isPremium={isPremium}>
                {client.logoUrl ? (
                  <img 
                    src={client.logoUrl} 
                    alt={`${client.name} logo`}
                    style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <Business sx={{ fontSize: 60 }} />
                )}
              </ClientIcon>
              
              <Typography variant="h4" fontWeight="bold" textAlign="center">
                {client.name}
              </Typography>
              
              <Box display="flex" alignItems="center" gap={1}>
                {isPremium && <Star sx={{ fontSize: 24 }} />}
                <Typography variant="h6" textAlign="center">
                  {client.tierTypeByTierTypeId?.name || 'Unknown'} Plan
                </Typography>
              </Box>
              
              <Typography variant="body1" textAlign="center" sx={{ opacity: 0.9 }}>
                {isPremium 
                  ? 'Premium features: Export, Summary Bar, Dashboard Types'
                  : 'Basic features: User Activity Dashboard'
                }
              </Typography>
              
              <Button
                variant="contained"
                size="large"
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  },
                }}
              >
                Select {client.name}
              </Button>
            </ClientCard>
          );
        })}
      </Box>
    </Container>
  );
};
