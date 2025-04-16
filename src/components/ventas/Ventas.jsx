import React from 'react';
import { Container, Typography, Paper, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Ventas = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Título y botones de navegación */}
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'primary.main',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          Ventas
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/ventas/procesar')}
          sx={{ mr: 2 }}
        >
          Procesar Venta
        </Button>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate('/ventas/historial')}
        >
          Historial de Ventas
        </Button>
      </Paper>
    </Container>
  );
};

export default Ventas; 