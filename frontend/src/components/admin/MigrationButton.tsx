import React, { useState } from 'react';
import { Button, Alert, CircularProgress, Box, Typography } from '@mui/material';
import { Construction as ConstructionIcon } from '@mui/icons-material';

const MigrationButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCreateTables = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin-setup/create-sports-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
        console.log('✅ Tables créées:', data.tables);
      } else {
        setError(data.message || 'Erreur inconnue');
      }
    } catch (err: any) {
      setError(err.message || 'Erreur réseau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3, border: '2px dashed #orange', borderRadius: 2, mb: 3 }}>
      <Typography variant="h6" gutterBottom color="warning.main">
        🚧 Migration Production - Tables Sportives
      </Typography>
      
      <Typography variant="body2" sx={{ mb: 2 }}>
        Cliquez pour créer toutes les tables du système sportif en production.
        <br />
        <strong>⚠️ À exécuter une seule fois !</strong>
      </Typography>

      <Button
        variant="contained"
        color="warning"
        startIcon={loading ? <CircularProgress size={20} /> : <ConstructionIcon />}
        onClick={handleCreateTables}
        disabled={loading || result?.success}
        sx={{ mb: 2 }}
      >
        {loading ? 'Création en cours...' : 'Créer les tables sportives'}
      </Button>

      {result?.success && (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="h6">✅ Tables créées avec succès !</Typography>
          <Typography variant="body2">
            Tables créées : {result.tables?.join(', ')}
          </Typography>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          <Typography variant="h6">❌ Erreur</Typography>
          <Typography variant="body2">{error}</Typography>
        </Alert>
      )}
    </Box>
  );
};

export default MigrationButton;
