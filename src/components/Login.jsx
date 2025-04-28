import React, { useState, useEffect, useMemo } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Grid, Link, Alert,
  IconButton, Tooltip, CircularProgress, Collapse, useTheme, Box
} from '@mui/material';
import { Lock, LightMode, DarkMode, Info, CheckCircle, Error } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api";

const ThemeToggle = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 1000,
  backgroundColor: theme.palette.background.default,
  color: theme.palette.text.primary,
  boxShadow: theme.shadows[3],
  '&:hover': {
    backgroundColor: theme.palette.action.hover
  }
}));

const AnimatedPaper = styled(Paper)(({ theme }) => ({
  padding: '2rem',
  borderRadius: '16px',
  background: theme.palette.background.paper,
  color: theme.palette.text.primary,
  backdropFilter: 'blur(8px)',
  transition: 'all 0.3s ease',
  transform: 'translateY(0)',
  opacity: 1,
  '&.locked': {
    transform: 'translateY(20px)',
    opacity: 0.7
  }
}));

const Login = () => {
  const [username, setUsername] = useState(localStorage.getItem('rememberedUser') || '');
  const [password, setPassword] = useState('');
  const [errorMessages, setErrorMessages] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [darkMode, setDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('themeMode');
    return savedMode ? savedMode === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const navigate = useNavigate();
  const theme = useTheme();

  const demoCredentials = useMemo(() => ({
    user: 'demo@romero.com',
    pass: 'Demo1234'
  }), []);

  useEffect(() => {
    if (isLocked) {
      const timer = setInterval(() => {
        setLockTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isLocked]);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'username':
        if (!value) error = 'Usuario requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Formato de email inválido';
        break;
      case 'password':
        if (!value) error = 'Contraseña requerida';
        else if (value.length < 8) error = 'Mínimo 8 caracteres';
        break;
      default:
        break;
    }
    setErrorMessages(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    const isValid = ['username', 'password'].every(field => 
      validateField(field, field === 'username' ? username : password)
    );

    if (!isValid) return;

    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login`, { username, password });
      
      if (response.data.auth) {
        localStorage.setItem('token', 'authenticated');
        sessionStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('rememberedUser', document.getElementById('rememberMe').checked ? username : '');
        
        toast.success('Bienvenido al sistema', {
          icon: <CheckCircle fontSize="large" sx={{ color: theme.palette.success.main }} />
        });
        
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setLockTime(300); // 5 minutos en segundos
      }

      const message = error.response?.data?.message || 'Error de conexión';
      setErrorMessages({ submit: message });
      toast.error(message, {
        icon: <Error fontSize="large" sx={{ color: theme.palette.error.main }} />
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('themeMode', !darkMode ? 'dark' : 'light');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      background: darkMode 
        ? 'linear-gradient(45deg, #1a1a1a 30%, #2d2d2d 90%)'
        : 'linear-gradient(45deg, #f8f9fa 30%, #e9ecef 90%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.5s ease'
    }}>
      <ThemeToggle onClick={toggleTheme}>
        {darkMode ? <LightMode /> : <DarkMode />}
      </ThemeToggle>

      <Container maxWidth="xs">
        <AnimatedPaper elevation={6} className={isLocked ? 'locked' : ''}>
          <Grid container direction="column" alignItems="center" spacing={3}>
            <Grid item>
              <Lock sx={{ 
                fontSize: '3rem', 
                color: theme.palette.mode === 'dark' ? '#FFD700' : '#1976d2',
                transition: 'color 0.3s ease'
              }} />
            </Grid>
            
            <Grid item sx={{ textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                Iniciar Sesión
              </Typography>
              <Typography variant="subtitle1">
                Bienvenido a Distribuciones Romero
              </Typography>
              <Tooltip 
                title={`Credenciales demo: ${demoCredentials.user} / ${demoCredentials.pass}`}
                arrow
              >
                <Info sx={{ 
                  mt: 1, 
                  color: theme.palette.text.secondary,
                  cursor: 'help' 
                }} />
              </Tooltip>
            </Grid>

            <Grid item sx={{ width: '100%' }}>
              <form onSubmit={handleSubmit}>
                <TextField
                  fullWidth
                  label="Usuario"
                  variant="outlined"
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => validateField('username', username)}
                  error={!!errorMessages.username}
                  helperText={errorMessages.username}
                  InputProps={{
                    endAdornment: username && (
                      <Collapse in={!!username}>
                        <CheckCircle color="success" sx={{ opacity: 0.7 }} />
                      </Collapse>
                    )
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'all 0.3s ease',
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />

                <TextField
                  fullWidth
                  label="Contraseña"
                  type="password"
                  margin="normal"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => validateField('password', password)}
                  error={!!errorMessages.password}
                  helperText={errorMessages.password}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      transition: 'all 0.3s ease',
                      '&.Mui-focused fieldset': {
                        borderColor: theme.palette.primary.main
                      }
                    }
                  }}
                />

                <Grid container alignItems="center" sx={{ mt: 1 }}>
                  <Grid item xs>
                    <label style={{ display: 'flex', alignItems: 'center' }}>
                      <input
                        type="checkbox"
                        id="rememberMe"
                        style={{ marginRight: 8 }}
                        defaultChecked={!!localStorage.getItem('rememberedUser')}
                      />
                      Recordar usuario
                    </label>
                  </Grid>
                </Grid>

                {isLocked && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    Cuenta bloqueada - Tiempo restante: {formatTime(lockTime)}
                  </Alert>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  disabled={isLoading || isLocked}
                  sx={{
                    mt: 3,
                    py: 2,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    transition: 'all 0.3s ease',
                    '&:disabled': {
                      opacity: 0.7
                    }
                  }}
                >
                  {isLoading ? (
                    <CircularProgress size={24} sx={{ color: 'white' }} />
                  ) : (
                    'Ingresar'
                  )}
                </Button>
              </form>
            </Grid>

            <Grid item>
              <Link 
                href="#"
                sx={{ 
                  color: theme.palette.mode === 'dark' ? '#FFD700' : '#1976d2',
                  '&:hover': { textDecoration: 'underline' }
                }}
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
          </Grid>
        </AnimatedPaper>
      </Container>
    </Box>
  );
};

export default Login;