import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Paper, Box, Chip, IconButton, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, Update, AttachMoney } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

// Componentes estilizados
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  position: 'relative',
  maxWidth: '500px',
  margin: '0 auto',
  border: '1px solid #e5e7eb',
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: '15px',
    '& fieldset': {
      border: 'none',
    },
    '&:hover fieldset': {
      border: 'none',
    },
    '&.Mui-focused fieldset': {
      border: '2px solid rgba(255,255,255,0.8)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(0,0,0,0.7)',
    fontWeight: '600',
  },
  '& .MuiInputBase-input': {
    color: '#333',
    fontWeight: '500',
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#3F51B5',
  color: 'white',
  borderRadius: '4px',
  padding: theme.spacing(1, 2),
  fontWeight: 'bold',
  textTransform: 'none',
  '&:hover': {
    backgroundColor: '#303F9F',
  },
  '&:disabled': {
    backgroundColor: '#e0e0e0',
    color: '#9e9e9e',
  },
  transition: 'all 0.2s ease',
}));

// Tarjeta para mostrar la última tasa
const StyledTasaCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: '4px',
  padding: theme.spacing(2),
  margin: theme.spacing(2, 0),
  border: '1px solid #3F51B5',
  textAlign: 'center',
  position: 'relative',
  zIndex: 2,
}));

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <StyledPaper elevation={0}>
        <Box>
          {/* Título principal */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#3F51B5', 
                fontWeight: 'bold',
                fontSize: '1.5rem',
                letterSpacing: '0.5px',
                mb: 0.5
              }}
            >
              TASA DE CAMBIO
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#3F51B5', 
                fontWeight: '500',
                fontSize: '1rem',
                letterSpacing: '0.3px'
              }}
            >
              OFICIAL BCV
            </Typography>
          </Box>

          {/* Tarjeta de última tasa */}
          {ultimaTasa && (
            <StyledTasaCard>
              <Typography 
                variant="h3" 
                sx={{ 
                  color: '#3F51B5', 
                  fontWeight: 'bold',
                  fontSize: '2.5rem',
                  mb: 1
                }}
              >
                {ultimaTasa.tasa}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: '#3F51B5', 
                  fontWeight: '500',
                  fontSize: '1rem'
                }}
              >
                Bs/USD
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#6b7280', 
                  fontSize: '0.875rem',
                  mt: 1
                }}
              >
                {new Date(ultimaTasa.fecha).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </StyledTasaCard>
          )}

          {/* Formulario de actualización */}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#6b7280', 
                mb: 1,
                fontSize: '0.875rem'
              }}
            >
              El tipo de cambio publicado por el BCV es el promedio ponderado resultante de las operaciones diarias de las mesas de cambio activas de las instituciones bancarias participantes.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <StyledTextField
                label="Nueva tasa de cambio ($/BS)"
                type="number"
                value={tasa}
                onChange={(e) => setTasa(e.target.value)}
                required
                size="small"
                sx={{ flex: 1 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney sx={{ color: '#3F51B5', fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <StyledButton 
                type="submit" 
                startIcon={<Update />}
                disabled={!tasa || tasa <= 0}
                size="small"
                sx={{ 
                  px: 2, 
                  py: 1,
                  fontSize: '0.875rem',
                  minWidth: '100px'
                }}
              >
                Actualizar
              </StyledButton>
            </Box>
          </Box>
        </Box>
      </StyledPaper>
    </motion.div>
  );
};

export default TasaCambio; 