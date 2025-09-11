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
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  position: 'relative',
  maxWidth: '300px',
  margin: '0 auto',
  border: '1px solid #e5e7eb',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
    transform: 'translateY(-2px)',
    '& .hover-form': {
      opacity: 1,
      maxHeight: '200px',
    }
  }
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
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#3F51B5', 
                fontWeight: 'bold',
                fontSize: '1rem',
                letterSpacing: '0.5px',
                mb: 0.5
              }}
            >
              TASA DE CAMBIO
            </Typography>
            <Typography 
              variant="body2" 
              sx={{ 
                color: '#3F51B5', 
                fontWeight: '500',
                fontSize: '0.75rem',
                letterSpacing: '0.3px'
              }}
            >
              OFICIAL BCV
            </Typography>
          </Box>

          {/* Tarjeta de última tasa */}
          {ultimaTasa && (
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <Typography 
                variant="h4" 
                sx={{ 
                  color: '#3F51B5', 
                  fontWeight: 'bold',
                  fontSize: '2rem',
                  mb: 0.5
                }}
              >
                {ultimaTasa.tasa}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#3F51B5', 
                  fontWeight: '500',
                  fontSize: '0.875rem',
                  mb: 0.5
                }}
              >
                Bs/USD
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#6b7280', 
                  fontSize: '0.75rem'
                }}
              >
                {new Date(ultimaTasa.fecha).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>
            </Box>
          )}

          {/* Formulario de actualización - Solo visible en hover */}
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            className="hover-form"
            sx={{ 
              opacity: 0,
              maxHeight: 0,
              overflow: 'hidden',
              transition: 'all 0.3s ease',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexDirection: 'column' }}>
              <StyledTextField
                label="Nueva tasa ($/BS)"
                type="number"
                value={tasa}
                onChange={(e) => setTasa(e.target.value)}
                required
                size="small"
                sx={{ width: '100%' }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoney sx={{ color: '#3F51B5', fontSize: '1rem' }} />
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
                  py: 0.5,
                  fontSize: '0.75rem',
                  width: '100%'
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