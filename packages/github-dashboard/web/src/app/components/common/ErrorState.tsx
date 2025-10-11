import { Container, Typography, Alert, Box, Button } from '@mui/material';
import React from 'react';

interface ErrorStateProps {
  message?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | false;
  py?: number;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong.',
  maxWidth = 'md',
  py = 8,
  onRetry,
}) => {
  return (
    <Container maxWidth={maxWidth} sx={{ py }}>
      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
        <Alert severity="error" sx={{ width: '100%' }}>
          <Typography variant="h6" gutterBottom>
            Error
          </Typography>
          <Typography variant="body1">{message}</Typography>
        </Alert>
        {onRetry && (
          <Button variant="contained" color="error" onClick={onRetry}>
            Retry
          </Button>
        )}
      </Box>
    </Container>
  );
};
