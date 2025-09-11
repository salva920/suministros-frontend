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
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: '16px',
  padding: theme.spacing(2.5),
  marginBottom: theme.spacing(2),
  boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
  position: 'relative',
  overflow: 'hidden',
  maxWidth: '500px',
  margin: '0 auto',
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
  background: 'linear-gradient(45deg, #FF6B6B 30%, #FF8E53 90%)',
  borderRadius: '15px',
  padding: '12px 24px',
  fontWeight: 'bold',
  textTransform: 'none',
  fontSize: '1rem',
  boxShadow: '0 4px 15px rgba(255,107,107,0.4)',
  '&:hover': {
    background: 'linear-gradient(45deg, #FF5252 30%, #FF7043 90%)',
    boxShadow: '0 6px 20px rgba(255,107,107,0.6)',
    transform: 'translateY(-2px)',
  },
  transition: 'all 0.3s ease',
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
          {/* Header con icono y última tasa */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <TrendingUp sx={{ fontSize: 24, color: 'white', mr: 1 }} />
              </motion.div>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'bold',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}
              >
                Tasa de Cambio
              </Typography>
            </Box>

            {/* Información de la tasa actual */}
            {ultimaTasa && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Box sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.15)', 
                  borderRadius: '10px', 
                  p: 1,
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  textAlign: 'center'
                }}>
                  <Typography variant="caption" sx={{ color: 'white', display: 'block', fontSize: '0.75rem', mb: 0.5 }}>
                    Última tasa:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                    <Chip
                      label={`${ultimaTasa.tasa} BS`}
                      size="small"
                      sx={{
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        color: '#333',
                        fontWeight: 'bold',
                        fontSize: '0.8rem',
                        px: 1,
                        py: 0.25,
                        height: '24px'
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.7rem' }}>
                      ({new Date(ultimaTasa.fecha).toLocaleDateString()})
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            )}
          </Box>

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