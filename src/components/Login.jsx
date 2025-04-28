import React, { useState, useEffect } from 'react';
import {
  Box, Container, TextField, Button, Typography, Paper, 
  InputAdornment, IconButton, CircularProgress, Alert, 
  Checkbox, FormControlLabel, useTheme, useMediaQuery,
  Switch, Tooltip, Fade, Slide, Grow
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  LockOutlined,
  AccountCircleOutlined,
  LoginOutlined,
  StorefrontOutlined,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ferreteriaBg from '../ferreteria.jpg';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

// Estilos de componentes con soporte para tema oscuro/claro
const LoginContainer = styled(Container)(({ theme, darkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  background: darkMode 
    ? 'linear-gradient(135deg, #0a1929 0%, #1a365d 50%, #2a4365 100%)'
    : 'linear-gradient(135deg, #0a2e63 0%, #1976d2 50%, #42a5f5 100%)',
  backgroundSize: 'cover',
  padding: theme.spacing(2),
  transition: 'background 0.5s ease'
}));

const LoginCard = styled(Paper)(({ theme, darkMode }) => ({
  padding: theme.spacing(4),
  borderRadius: '16px',
  boxShadow: '0 8px 40px rgba(0, 0, 0, 0.15)',
  width: '100%',
  maxWidth: '450px',
  background: darkMode 
    ? 'rgba(30, 41, 59, 0.9)'
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: darkMode 
    ? '1px solid rgba(255, 255, 255, 0.1)'
    : '1px solid rgba(255, 255, 255, 0.2)',
  transition: 'all 0.3s ease'
}));

const FormField = styled(TextField)(({ theme, darkMode }) => ({
  marginBottom: theme.spacing(3),
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    transition: 'all 0.3s ease',
    backgroundColor: darkMode ? 'rgba(15, 23, 42, 0.6)' : 'rgba(255, 255, 255, 0.8)',
    '&:hover': {
      boxShadow: darkMode 
        ? '0 4px 8px rgba(0, 0, 0, 0.2)'
        : '0 4px 8px rgba(0, 0, 0, 0.05)'
    },
    '&.Mui-focused': {
      boxShadow: darkMode 
        ? '0 4px 12px rgba(59, 130, 246, 0.25)'
        : '0 4px 12px rgba(25, 118, 210, 0.15)'
    }
  },
  '& .MuiInputLabel-root': {
    color: darkMode ? 'rgba(255, 255, 255, 0.7)' : undefined
  },
  '& .MuiOutlinedInput-input': {
    color: darkMode ? 'rgba(255, 255, 255, 0.9)' : undefined
  }
}));

const LoginButton = styled(Button)(({ theme, darkMode }) => ({
  marginTop: theme.spacing(2),
  height: '50px',
  borderRadius: '10px',
  textTransform: 'none',
  fontSize: '1rem',
  fontWeight: 'bold',
  boxShadow: darkMode 
    ? '0 4px 12px rgba(59, 130, 246, 0.3)'
    : '0 4px 12px rgba(25, 118, 210, 0.3)',
  background: darkMode 
    ? 'linear-gradient(45deg, #3b82f6 30%, #60a5fa 90%)'
    : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  transition: 'all 0.3s ease',
  '&:hover': {
    boxShadow: darkMode 
      ? '0 6px 16px rgba(59, 130, 246, 0.4)'
      : '0 6px 16px rgba(25, 118, 210, 0.4)',
    transform: 'translateY(-2px)'
  }
}));

const ThemeToggle = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '20px',
  right: '20px',
  zIndex: 100,
  display: 'flex',
  alignItems: 'center',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
  borderRadius: '30px',
  padding: '5px 10px',
  boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
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
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('darkMode') === 'true' || false
  );
  const [attemptCount, setAttemptCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimer, setBlockTimer] = useState(0);
  
  // Efecto para manejar el contador cuando se bloquea
  useEffect(() => {
    let interval;
    if (isBlocked && blockTimer > 0) {
      interval = setInterval(() => {
        setBlockTimer(prev => prev - 1);
      }, 1000);
    } else if (blockTimer === 0 && isBlocked) {
      setIsBlocked(false);
    }
    
    return () => clearInterval(interval);
  }, [isBlocked, blockTimer]);
  
  // Verificar si hay usuario guardado
  useEffect(() => {
    const savedUsername = localStorage.getItem('savedUsername');
    if (savedUsername) {
      setCredentials(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, []);
  
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
  
  const handleThemeToggle = () => {
    setDarkMode(prev => {
      const newValue = !prev;
      localStorage.setItem('darkMode', newValue);
      return newValue;
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Si está bloqueado, no procesar
    if (isBlocked) return;
    
    // Validaciones
    if (!credentials.username) {
      setError("Por favor ingresa tu nombre de usuario");
      return;
    }
    
    if (!credentials.password) {
      setError("Por favor ingresa tu contraseña");
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
          
          // Guardar en localStorage o sessionStorage según rememberMe
          if (rememberMe) {
            localStorage.setItem('userData', JSON.stringify(userData));
            localStorage.setItem('savedUsername', credentials.username);
          } else {
            sessionStorage.setItem('userData', JSON.stringify(userData));
            localStorage.removeItem('savedUsername');
          }
          
          // Resetear el contador de intentos
          setAttemptCount(0);
          
          // Redireccionar
          navigate('/dashboard');
        } else {
          // Incrementar el contador de intentos fallidos
          const newAttemptCount = attemptCount + 1;
          setAttemptCount(newAttemptCount);
          
          // Si hay demasiados intentos, bloquear temporalmente
          if (newAttemptCount >= 3) {
            const blockTime = 30; // 30 segundos de bloqueo
            setIsBlocked(true);
            setBlockTimer(blockTime);
            setError(`Demasiados intentos fallidos. Cuenta bloqueada por ${blockTime} segundos.`);
          } else {
            setError(`Credenciales incorrectas. Intento ${newAttemptCount}/3. Prueba con admin/admin123`);
          }
        }
        setLoading(false);
      }, 1500);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Error al iniciar sesión. Inténtalo de nuevo.');
      setLoading(false);
    }
  };
  
  // Función para formatear el tiempo de bloqueo
  const formatBlockTime = (seconds) => {
    return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
  };
  
  return (
    <LoginContainer maxWidth={false} darkMode={darkMode}>
      {/* Toggle de tema claro/oscuro */}
      <ThemeToggle>
        <Typography variant="body2" sx={{ 
          color: 'white', 
          mr: 1,
          display: { xs: 'none', sm: 'block' }
        }}>
          {darkMode ? 'Modo Claro' : 'Modo Oscuro'}
        </Typography>
        <IconButton 
          onClick={handleThemeToggle}
          sx={{ color: 'white' }}
        >
          {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </ThemeToggle>
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ width: '100%' }}
      >
        <LoginCard elevation={6} darkMode={darkMode}>
          <motion.div variants={itemVariants}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center',
              mb: 4
            }}>
              <motion.div
                whileHover={{ 
                  rotate: [0, -10, 10, -10, 0],
                  transition: { duration: 0.5 }
                }}
              >
                <StorefrontOutlined 
                  sx={{ 
                    fontSize: 60, 
                    color: darkMode ? '#60a5fa' : 'primary.main',
                    mb: 2 
                  }} 
                />
              </motion.div>
              <Typography 
                variant="h4" 
                component="h1" 
                fontWeight="bold" 
                align="center"
                sx={{ color: darkMode ? 'white' : 'inherit' }}
              >
                FerreExpress
              </Typography>
              <Typography 
                variant="body1" 
                align="center" 
                sx={{ 
                  mt: 1,
                  color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary'
                }}
              >
                Sistema de Gestión de Ferretería
              </Typography>
            </Box>
          </motion.div>
          
          <form onSubmit={handleSubmit}>
            {error && (
              <Grow in={!!error}>
                <Alert 
                  severity={isBlocked ? "warning" : "error"} 
                  sx={{ 
                    mb: 3, 
                    borderRadius: '10px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                  action={
                    <Tooltip title="Las credenciales de prueba son admin/admin123">
                      <IconButton color="inherit" size="small">
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                >
                  {error}
                  {isBlocked && (
                    <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                      Podrás intentar nuevamente en: {formatBlockTime(blockTimer)}
                    </Typography>
                  )}
                </Alert>
              </Grow>
            )}
            
            <motion.div variants={itemVariants}>
              <FormField
                fullWidth
                label="Usuario"
                name="username"
                value={credentials.username}
                onChange={handleChange}
                variant="outlined"
                darkMode={darkMode}
                disabled={isBlocked || loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountCircleOutlined color={darkMode ? "info" : "primary"} />
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
                darkMode={darkMode}
                disabled={isBlocked || loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlined color={darkMode ? "info" : "primary"} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        edge="end"
                        sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : undefined }}
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
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2
              }}>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={rememberMe}
                      onChange={handleRememberMe}
                      color={darkMode ? "info" : "primary"}
                      disabled={isBlocked || loading}
                      sx={{
                        color: darkMode ? 'rgba(255,255,255,0.7)' : undefined,
                        '&.Mui-checked': {
                          color: darkMode ? '#60a5fa' : undefined,
                        }
                      }}
                    />
                  }
                  label={
                    <Typography 
                      variant="body2"
                      sx={{ color: darkMode ? 'rgba(255,255,255,0.7)' : undefined }}
                    >
                      Recordarme
                    </Typography>
                  }
                />
                <Typography 
                  variant="body2" 
                  sx={{ 
                    cursor: 'pointer',
                    fontWeight: 'medium',
                    color: darkMode ? '#60a5fa' : 'primary.main',
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
              whileHover={{ scale: isBlocked ? 1 : 1.02 }}
              whileTap={{ scale: isBlocked ? 1 : 0.98 }}
            >
              <LoginButton
                fullWidth
                variant="contained"
                color={darkMode ? "info" : "primary"}
                type="submit"
                disabled={isBlocked || loading}
                startIcon={loading ? null : <LoginOutlined />}
                darkMode={darkMode}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : isBlocked ? (
                  `Bloqueado (${formatBlockTime(blockTimer)})`
                ) : (
                  'Iniciar Sesión'
                )}
              </LoginButton>
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography 
                  variant="body2" 
                  sx={{ color: darkMode ? 'rgba(255,255,255,0.5)' : 'text.secondary' }}
                >
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
