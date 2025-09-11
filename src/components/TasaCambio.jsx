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
  background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #3b82f6 100%)',
  borderRadius: '16px',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(2),
  boxShadow: '0 8px 25px rgba(30, 58, 138, 0.3)',
  position: 'relative',
  overflow: 'hidden',
  maxWidth: '500px',
  margin: '0 auto',
  border: '2px solid rgba(255,255,255,0.1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
    zIndex: 1
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
  background: 'linear-gradient(45deg, #dc2626 0%, #ef4444 100%)',
  color: 'white',
  borderRadius: '15px',
  padding: theme.spacing(1, 2),
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: '0 4px 15px rgba(220, 38, 38, 0.4)',
  '&:hover': {
    background: 'linear-gradient(45deg, #b91c1c 0%, #dc2626 100%)',
    boxShadow: '0 6px 20px rgba(220, 38, 38, 0.6)',
    transform: 'translateY(-2px)',
  },
  '&:disabled': {
    background: 'rgba(255,255,255,0.3)',
    color: 'rgba(255,255,255,0.7)',
    boxShadow: 'none',
  },
  transition: 'all 0.3s ease',
}));

// Tarjeta para mostrar la última tasa
const StyledTasaCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(255,255,255,0.95)',
  borderRadius: '12px',
  padding: theme.spacing(2),
  margin: theme.spacing(2, 0),
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
  border: '2px solid rgba(30, 58, 138, 0.2)',
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
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          {/* Título principal centrado */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                >
                  <TrendingUp sx={{ fontSize: 28, color: 'white', mr: 1.5 }} />
                </motion.div>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    color: 'white', 
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    fontSize: '1.8rem'
                  }}
                >
                  Tasa de Cambio
                </Typography>
              </Box>
            </motion.div>
          </Box>

          {/* Tarjeta de última tasa */}
          {ultimaTasa && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <StyledTasaCard>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: '#1e3a8a', 
                    fontWeight: 'bold',
                    mb: 1,
                    fontSize: '1.1rem'
                  }}
                >
                  Última Tasa
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    label={`${ultimaTasa.tasa} BS`}
                    sx={{
                      backgroundColor: '#1e3a8a',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      px: 2,
                      py: 1,
                      height: '32px'
                    }}
                  />
                </Box>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#64748b', 
                    fontSize: '0.85rem'
                  }}
                >
                  {new Date(ultimaTasa.fecha).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </StyledTasaCard>
            </motion.div>
          )}

          {/* Formulario de actualización - ancho completo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
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
                      <AttachMoney sx={{ color: 'rgba(0,0,0,0.6)', fontSize: '1.1rem' }} />
                    </InputAdornment>
                  ),
                }}
              />
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <StyledButton 
                  type="submit" 
                  startIcon={<Update />}
                  disabled={!tasa || tasa <= 0}
                  size="small"
                  sx={{ 
                    px: 2, 
                    py: 1,
                    fontSize: '0.85rem',
                    minWidth: '100px'
                  }}
                >
                  Actualizar
                </StyledButton>
              </motion.div>
            </Box>
          </motion.div>
        </Box>
      </StyledPaper>
    </motion.div>
  );
};

export default TasaCambio; 