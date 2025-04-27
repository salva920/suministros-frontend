import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Paper, Box } from '@mui/material';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

const TasaCambio = () => {
  const [tasa, setTasa] = useState('');
  const [ultimaTasa, setUltimaTasa] = useState(null);

  // Obtener la última tasa de cambio al cargar el componente
  useEffect(() => {
    const obtenerUltimaTasa = async () => {
      try {
        const response = await axios.get(`${API_URL}/tasa-cambio`);
        setUltimaTasa(response.data);
      } catch (error) {
        console.error('Error al obtener la tasa de cambio:', error);
        toast.error('Error al obtener la tasa de cambio');
      }
    };

    obtenerUltimaTasa();
  }, []);

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!tasa || tasa <= 0) {
      toast.error('La tasa de cambio debe ser un número positivo');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/tasa-cambio`, { tasa: Number(tasa) });
      setUltimaTasa(response.data);
      toast.success('Tasa de cambio actualizada correctamente');
      setTasa('');
    } catch (error) {
      console.error('Error al actualizar la tasa de cambio:', error);
      toast.error('Error al actualizar la tasa de cambio');
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa' }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Tasa de Cambio ($/BS)
      </Typography>

      {ultimaTasa && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          Última tasa de cambio: <strong>{ultimaTasa.tasa} BS</strong> (fecha: {new Date(ultimaTasa.fecha).toLocaleDateString()})
        </Typography>
      )}

      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Nueva tasa de cambio ($/BS)"
          type="number"
          value={tasa}
          onChange={(e) => setTasa(e.target.value)}
          required
          sx={{ flex: 1 }}
        />
        <Button type="submit" variant="contained" color="primary">
          Actualizar
        </Button>
      </Box>
    </Paper>
  );
};

export default TasaCambio; 