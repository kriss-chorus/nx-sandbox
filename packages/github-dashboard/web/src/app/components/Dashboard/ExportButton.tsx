import { Download } from '@mui/icons-material';
import { Alert, Button, Snackbar } from '@mui/material';
import React, { useState } from 'react';

import { useClientContext } from '../../context/ClientContext';

interface ExportButtonProps {
  dashboardId: string;
  dashboardName: string;
}

export function ExportButton({ dashboardId, dashboardName }: ExportButtonProps): React.ReactElement {
  const { activeClient } = useClientContext();
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
  }>({ open: false, message: '', severity: 'info' });

  const handleExport = async () => {
    if (!activeClient) return;

    setLoading(true);
    
    try {
      // TODO: Implement backend endpoint GET /api/dashboards/:id/export.csv
      // For now, show a placeholder message
      setSnackbar({
        open: true,
        message: 'Export feature coming soon! Backend endpoint needs to be implemented.',
        severity: 'info',
      });

      // Future implementation would be:
      /*
      const response = await fetch(`/api/dashboards/${dashboardId}/export.csv`, {
        headers: {
          'X-Demo-Client-Id': activeClient.id,
        },
      });

      if (response.status === 403) {
        setSnackbar({
          open: true,
          message: 'Export requires premium tier',
          severity: 'error',
        });
        return;
      }

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dashboardName}-activity-export.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSnackbar({
        open: true,
        message: 'Export completed successfully!',
        severity: 'success',
      });
      */
    } catch (error) {
      console.error('Export error:', error);
      setSnackbar({
        open: true,
        message: 'Export failed. Please try again.',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <>
      <Button
        variant="contained"
        startIcon={<Download />}
        onClick={handleExport}
        disabled={loading}
        sx={{
          background: 'linear-gradient(45deg, #bd93f9 30%, #ff79c6 90%)',
          '&:hover': {
            background: 'linear-gradient(45deg, #a373e6 30%, #e64fb3 90%)',
          },
        }}
      >
        {loading ? 'Exporting...' : 'Export CSV'}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
