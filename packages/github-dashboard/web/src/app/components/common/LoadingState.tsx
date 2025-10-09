import React from 'react';
import { Container, Typography, CircularProgress, Box } from '@mui/material';

interface LoadingStateProps {
  message?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | false;
  py?: number;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  maxWidth = 'md',
  py = 8,
}) => {
  return (
    <Container maxWidth={maxWidth} sx={{ py }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress />
        <Typography variant="h5" align="center" gutterBottom>
          {message}
        </Typography>
      </Box>
    </Container>
  );
};
