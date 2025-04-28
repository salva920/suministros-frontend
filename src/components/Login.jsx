import React, { useState } from 'react';
import {
  Box, Container, TextField, Button, Typography, Paper, 
  InputAdornment, IconButton, CircularProgress, Alert, 
  Checkbox, FormControlLabel, useTheme, useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  AccountCircleOutlined,
  LoginOutlined,
  StorefrontOutlined
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import backgroundImage from '../assets/ferreteria-bg.jpg'; // Asegúrate de tener esta imagen

// URL de la API
const API_URL = "https://suministros-backend.vercel.app/api";

// Estilos de componentes
const LoginContainer = styled(Container)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: `linear-gradient(rgba(25, 118, 210, 0.7), rgba(25, 118, 210, 0.4)), url(${backgroundImage})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  padding: theme.spacing(2)
}));

const LoginCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.12)',
  width: '100%',
  maxWidth: '450px',
  background: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.2)'
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: theme.spacing(4)
}));

const FormField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    '&:hover': {
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.05)'
    },
    '&.Mui-focused': {
      boxShadow: '0 4px 12px rgba(25, 118, 210, 0.15)'
    }
  }
}));

const LoginButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(2),
  height: '50px',
  borderRadius: '10px',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 'bold',
  boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
    transform: 'translateY(-2px)'
  }
}));

// Variantes de animación para Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25
    }
  }
};

const Login = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  
  // Estados
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [rememberMe, setRememberMe] = useState(false);
  
  // Manejadores de eventos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null); // Limpiar error al cambiar los valores
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(prev => !prev);
  };
  
  const handleRememberMe = (e) => {
    setRememberMe(e.target.checked);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!credentials.username || !credentials.password) {
      setError("Por favor completa todos los campos");
      return;
    }
    
    setLoading(true);
    try {
      // Simulación de login para desarrollo
      // En producción, descomentar la siguiente línea:
      // const response = await axios.post(`${API_URL}/auth/login`, credentials);
      
      // Simulando respuesta exitosa
      setTimeout(() => {
        // Simulación de credenciales válidas
        if (credentials.username === 'admin' && credentials.password === 'admin123') {
          const userData = {
            id: 1,
            username: credentials.username,
            name: 'Administrador',
            role: 'admin',
            token: 'simulated-jwt-token'
          };
          
          if (rememberMe) {
            localStorage.setItem('userData', JSON.stringify(userData));
          } else {
            sessionStorage.setItem('userData', JSON.stringify(userData));
          }
          
          navigate('/dashboard');
        } else {
          setError('Credenciales incorrectas. Intenta con admin/admin123');
        }
        setLoading(false);
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      setLoading(false);
    }
  };
  
  return (
    <LoginContainer maxWidth={false}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%' }}
      >
        <LoginCard elevation={6}>
          <motion.div variants={itemVariants}>
            <LogoContainer>
              <motion.div
                whileHover={{ 
                  rotate: [0, -10, 10, -10, 0],
                  transition: { duration: 0.5 }
                }}
              >
                <StorefrontOutlined sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
              </motion.div>
              <Typography variant="h4" component="h1" fontWeight="bold" align="center">
                FerreExpress
              </Typography>
              <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 1 }}>
                Sistema de Gestión de Ferretería
              </Typography>
            </LogoContainer>
          </motion.div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Alert severity="error" sx={{ mb: 3, borderRadius: '10px' }}>
                  {error}
                </Alert>
              </motion.div>
            )}
            
            <motion.div variants={itemVariants}>
              <FormField
                fullWidth
                label="Usuario"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleOutlined color="primary" />
                    </InputAdornment>
                  ),
                }}
                autoComplete="username"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <FormField
                fullWidth
                label="Contraseña"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={credentials.password}
                onChange={handleChange}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                autoComplete="current-password"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={rememberMe}
                      onChange={handleRememberMe}
                      color="primary"
                    />
                  }
                  label="Recordarme"
                />
                <Typography 
                  variant="body2" 
                  color="primary" 
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: 'medium',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </Typography>
              </Box>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LoginButton
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                disabled={loading}
                startIcon={loading ? null : <LoginOutlined />}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Iniciar Sesión'}
              </LoginButton>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  © {new Date().getFullYear()} FerreExpress. Todos los derechos reservados.
                </Typography>
              </Box>
            </motion.div>
          </form>
        </LoginCard>
      </motion.div>
    </LoginContainer>
  );
};

export default Login; 
