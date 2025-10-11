import styled from '@emotion/styled';
import { Business, Star } from '@mui/icons-material';
import { Box, Button, Paper, Typography } from '@mui/material';
import React from 'react';

export interface ClientCardProps {
  name: string;
  logoUrl?: string;
  tierName?: string;
  isPremium: boolean;
  onClick?: () => void;
  buttonLabel?: string;
  elevation?: number;
}

const CardContainer = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isPremium',
})<{ isPremium: boolean }>`
  cursor: pointer;
  padding: 32px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 400px;
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

export const ClientCard: React.FC<ClientCardProps> = ({
  name,
  logoUrl,
  tierName,
  isPremium,
  onClick,
  buttonLabel,
  elevation = 3,
}) => {
  return (
    <CardContainer isPremium={isPremium} elevation={elevation} onClick={onClick}>
      <ClientIcon isPremium={isPremium}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={`${name} logo`}
            style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <Business sx={{ fontSize: 60 }} />
        )}
      </ClientIcon>

      <Typography variant="h4" fontWeight="bold" textAlign="center">
        {name}
      </Typography>

      <Box display="flex" alignItems="center" gap={1}>
        {isPremium && <Star sx={{ fontSize: 24 }} />}
        <Typography variant="h6" textAlign="center">
          {tierName || 'Unknown'} Plan
        </Typography>
      </Box>

      <Typography variant="body1" textAlign="center" sx={{ opacity: 0.9 }}>
        {isPremium
          ? 'Premium features: Export, Summary Bar, Dashboard Types'
          : 'Basic features: User Activity Dashboard'}
      </Typography>

      {buttonLabel && (
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
          {buttonLabel}
        </Button>
      )}
    </CardContainer>
  );
};

ClientCard.displayName = 'ClientCard';
