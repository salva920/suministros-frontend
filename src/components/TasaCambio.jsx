import React, { useState, useEffect } from 'react';
import { TextField, Button, Typography, Paper, Box, Chip, IconButton, InputAdornment } from '@mui/material';
import { styled } from '@mui/material/styles';
import { TrendingUp, Update, AttachMoney, CurrencyExchange } from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

// Componentes estilizados
const StyledPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
  position: 'relative',
  maxWidth: '450px',
  margin: '0 auto',
  border: '2px solid #e3f2fd',
  transition: 'all 0.3s ease',
  overflow: 'visible',
  background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
  '&:hover': {
    boxShadow: '0 10px 30px rgba(33, 150, 243, 0.2)',
    transform: 'translateY(-3px)',
    border: '2px solid #1976d2',
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
  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  color: 'white',
  borderRadius: '8px',
  padding: theme.spacing(1, 2),
  fontWeight: 'bold',
  textTransform: 'none',
  boxShadow: '0 3px 5px rgba(33, 150, 243, 0.3)',
  '&:hover': {
    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
    boxShadow: '0 5px 10px rgba(33, 150, 243, 0.4)',
    transform: 'translateY(-1px)',
  },
  '&:disabled': {
    background: '#e0e0e0',
    color: '#9e9e9e',
    boxShadow: 'none',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Información de la tasa */}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '140px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <CurrencyExchange sx={{ color: '#1976d2', fontSize: '1.2rem' }} />
              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#1976d2', 
                  fontWeight: 'bold',
                  fontSize: '0.8rem',
                  letterSpacing: '0.8px',
                  textTransform: 'uppercase'
                }}
              >
                TASA DE CAMBIO
              </Typography>
            </Box>
            {ultimaTasa && (
              <>
                <Typography 
                  variant="h5" 
                  sx={{ 
                    color: '#1976d2', 
                    fontWeight: 'bold',
                    fontSize: '1.8rem',
                    lineHeight: 1,
                    textShadow: '0 2px 4px rgba(25, 118, 210, 0.2)',
                    mb: 0.5
                  }}
                >
                  {ultimaTasa.tasa}
                </Typography>
                <Typography 
                  variant="caption" 
                  sx={{ 
                    color: '#666', 
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    backgroundColor: '#e3f2fd',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: '1px solid #bbdefb'
                  }}
                >
                  Bs/USD
                </Typography>
              </>
            )}
          </Box>

          {/* Formulario de actualización - Siempre visible */}
          <Box 
            component="form" 
            onSubmit={handleSubmit} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5,
              flex: 1
            }}
          >
            <StyledTextField
              label="Nueva tasa"
              type="number"
              value={tasa}
              onChange={(e) => setTasa(e.target.value)}
              required
              size="small"
              sx={{ 
                width: '130px',
                '& .MuiInputBase-input': {
                  fontSize: '0.9rem',
                  padding: '10px 14px',
                  fontWeight: '600'
                },
                '& .MuiInputLabel-root': {
                  fontWeight: 'bold',
                  fontSize: '0.8rem'
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <AttachMoney sx={{ color: '#1976d2', fontSize: '1rem' }} />
                  </InputAdornment>
                ),
              }}
            />
            <StyledButton 
              type="submit" 
              startIcon={<Update sx={{ fontSize: '1rem' }} />}
              disabled={!tasa || tasa <= 0}
              size="small"
              sx={{ 
                px: 2.5, 
                py: 1,
                fontSize: '0.8rem',
                minWidth: '90px',
                fontWeight: 'bold'
              }}
            >
              Actualizar
            </StyledButton>
          </Box>
        </Box>
      </StyledPaper>
    </motion.div>
  );
};

export default TasaCambio; 