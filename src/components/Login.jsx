import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Grid, Link, Alert } from '@mui/material';
import { Lock as LockIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ferreteriaBg from '../ferreteria.jpg';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = 'http://localhost:5000/api'; // Añadir constante API_URL

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Por favor, completa todos los campos.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/login`, { // Usar API_URL
        username,
        password 
      });
      
      if (response.data.auth) {
        localStorage.setItem('token', response.data.token);
        sessionStorage.setItem('isLoggedIn', 'true');
        toast.success('Bienvenido al sistema');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      if (error.response) {
        // Manejo de errores del servidor
        error.response.status === 401 
          ? toast.error('Credenciales inválidas')
          : toast.error('Error en el servidor');
      } else {
        toast.error('Error de conexión');
      }
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundImage: `url(${ferreteriaBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <Container maxWidth="xs">
        <Paper elevation={6} sx={{ 
          padding: '2rem',
          borderRadius: '12px',
          background: 'rgba(26, 54, 93, 0.9)', // Fondo semi-transparente
          color: 'white',
          backdropFilter: 'blur(4px)'
        }}>
          <Grid container direction="column" alignItems="center" spacing={3}>
            <Grid item>
              <LockIcon sx={{ fontSize: '3rem', color: '#FFD700' }} />
            </Grid>
            <Grid item>
              <Typography variant="h4" align="center" sx={{ fontWeight: 'bold' }}>
                Iniciar Sesión
              </Typography>
              <Typography variant="subtitle1" align="center" sx={{ marginTop: '0.5rem' }}>
                Bienvenido a la Ferretería 
              </Typography>
            </Grid>
            <Grid item sx={{ width: '100%' }}>
              <form onSubmit={handleSubmit}>
                {error && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}
                <TextField
                  fullWidth
                  label="Usuario"
                  variant="outlined"
                  margin="normal"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                      '&:hover fieldset': {
                        borderColor: '#FF6B35',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B35',
                      },
                    }
                  }}
                  required
                />
                <TextField
                  fullWidth
                  label="Contraseña"
                  variant="outlined"
                  margin="normal"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'transparent',
                      },
                      '&:hover fieldset': {
                        borderColor: '#FF6B35',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#FF6B35',
                      },
                    }
                  }}
                  required
                />
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  sx={{
                    marginTop: '1.5rem',
                    padding: '12px',
                    backgroundColor: '#FF6B35',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    borderRadius: '8px',
                    '&:hover': {
                      backgroundColor: '#E65A2E'
                    }
                  }}
                >
                  Ingresar
                </Button>
              </form>
            </Grid>
            <Grid item>
              <Link href="#" variant="body2" sx={{ color: '#FFD700' }}>
                ¿Olvidaste tu contraseña?
              </Link>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </div>
  );
};

export default Login; 
