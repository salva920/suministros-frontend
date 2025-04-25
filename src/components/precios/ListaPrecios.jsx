import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, CircularProgress
} from '@mui/material';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Versión minimalista para debugging
const ListaPrecios = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Solo para verificar que la API funciona
        const response = await axios.get(`${API_URL}/listaprecios`);
        console.log("Respuesta API:", response.data); // Log para debugging
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.message || "Error al cargar datos");
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6">
          Error: {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Gestión de Precios
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Typography>
          Datos cargados correctamente. Verifica la consola para más detalles.
        </Typography>
        <pre style={{ overflowX: 'auto', background: '#f5f5f5', padding: '8px' }}>
          {JSON.stringify(data, null, 2)}
        </pre>
      </Paper>
    </Container>
  );
};

export default ListaPrecios; 