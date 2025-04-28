import React, { useState } from 'react';
import { 
  Container, Paper, Typography, TextField, Button, Grid, Link, Alert,
  InputAdornment, IconButton, CircularProgress, FormControlLabel, Checkbox,
  Box, Slide, Fade, Modal
} from '@mui/material';
import { 
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ferreteriaBg from '../ferreteria.jpg';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { motion } from 'framer-motion';

const API_URL = "https://suministros-backend.vercel.app/api"; // Ya incluye "/api"

// Variantes para animaciones
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      duration: 0.6,
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
    transition: { type: "spring", stiffness: 300, damping: 24 }
  }
};

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();
  
  // Estados para el modal de recuperación de contraseña
  const [openRecovery, setOpenRecovery] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);

  // Handler para abrir/cerrar el modal
  const handleOpenRecovery = (e) => {
    e.preventDefault();
    setOpenRecovery(true);
  };
  
  const handleCloseRecovery = () => {
    setOpenRecovery(false);
    setCurrentPassword('');
    setNewPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
  };

  // Handler para enviar el cambio de contraseña
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (!username) {
      toast.error('Por favor, ingresa tu nombre de usuario');
      return;
    }
    
    if (!currentPassword || !newPassword) {
      toast.error('Por favor, completa todos los campos');
      return;
    }

    setRecoveryLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/update-password`, {
        username,
        currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        toast.success('Contraseña actualizada correctamente');
        handleCloseRecovery();
      }
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      if (error.response) {
        if (error.response.status === 404) {
          toast.error('Ruta no encontrada - Contacta al administrador');
        } else if (error.response.status === 401) {
          toast.error('Contraseña actual incorrecta');
        } else {
          toast.error(error.response.data?.message || 'Error al cambiar contraseña');
        }
      } else {
        toast.error('Error de conexión con el servidor');
      }
    } finally {
      setRecoveryLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username || !password) {
      toast.error('Por favor, completa todos los campos.');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        username,
        password 
      });
      
      if (response.data.auth) {
        localStorage.setItem('token', 'authenticated');
        sessionStorage.setItem('isLoggedIn', 'true');
        
        if (rememberMe) {
          localStorage.setItem('username', username);
        }
        
        toast.success('Bienvenido al sistema');
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error('Error en autenticación:', error);
      if (error.response) {
        error.response.status === 401 
          ? toast.error('Credenciales inválidas')
          : toast.error('Error en el servidor');
      } else {
        toast.error('Error de conexión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Modal de recuperación
  const recoveryModal = (
    <Modal
      open={openRecovery}
      onClose={handleCloseRecovery}
      aria-labelledby="recovery-modal"
      aria-describedby="password-recovery"
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)'
      }}
    >
      <Fade in={openRecovery}>
        <Paper sx={{ 
          padding: '2rem',
          borderRadius: '16px',
          background: 'rgba(255, 255, 255, 0.15)',
          color: 'white',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          width: '400px',
          maxWidth: '90%',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
        }}>
          <Typography variant="h5" gutterBottom sx={{ 
            textAlign: 'center', 
            mb: 3,
            fontWeight: 'bold',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Cambiar Contraseña
          </Typography>
          
          <form onSubmit={handlePasswordChange}>
            <TextField
              fullWidth
              label="Contraseña Actual"
              variant="outlined"
              margin="normal"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255, 107, 53, 0.8)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                borderRadius: '12px',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'transparent',
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FF6B35',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B35',
                    borderWidth: '2px'
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.7)'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#FF6B35'
                },
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
              required
            />

            <TextField
              fullWidth
              label="Nueva Contraseña"
              variant="outlined"
              margin="normal"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'rgba(255, 107, 53, 0.8)' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.92)',
                borderRadius: '12px',
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'transparent',
                    transition: 'all 0.2s ease-in-out',
                  },
                  '&:hover fieldset': {
                    borderColor: '#FF6B35',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#FF6B35',
                    borderWidth: '2px'
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.7)'
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#FF6B35'
                },
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)'
                }
              }}
              required
            />

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button 
                onClick={handleCloseRecovery}
                variant="outlined"
                sx={{ 
                  color: 'white', 
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                  '&:hover': {
                    borderColor: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                variant="contained"
                disabled={recoveryLoading}
                sx={{ 
                  backgroundColor: '#FF6B35',
                  '&:hover': { 
                    backgroundColor: '#E65A2E',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(255, 107, 53, 0.4)'
                  },
                  boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
                  transition: 'all 0.3s ease'
                }}
              >
                {recoveryLoading ? 
                  <CircularProgress size={24} color="inherit" /> : 
                  'Cambiar Contraseña'
                }
              </Button>
            </Box>
          </form>
        </Paper>
      </Fade>
    </Modal>
  );

  return (
    <div style={{ 
      minHeight: '100vh',
      backgroundImage: `url(${ferreteriaBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Overlay con efecto de gradiente */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(0,22,57,0.85) 0%, rgba(26,54,93,0.75) 100%)',
        zIndex: 1
      }} />
      
      <Container maxWidth="xs" sx={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          style={{ width: '100%' }}
        >
          <Paper elevation={16} sx={{ 
            padding: '2.5rem',
            borderRadius: '16px',
            background: 'rgba(255, 255, 255, 0.15)', 
            color: 'white',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
          }}>
            <Grid container direction="column" alignItems="center" spacing={3}>
              <Grid item>
                <motion.div
                  whileHover={{ rotate: [0, -15, 15, -15, 0], scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Box sx={{ 
                    backgroundColor: 'rgba(255, 215, 0, 0.15)', 
                    borderRadius: '50%', 
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)'
                  }}>
                    <LockIcon sx={{ fontSize: '3.5rem', color: '#FFD700' }} />
                  </Box>
                </motion.div>
              </Grid>
              
              <Grid item>
                <motion.div variants={itemVariants}>
                  <Typography variant="h4" align="center" sx={{ 
                    fontWeight: 'bold',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    letterSpacing: '0.5px'
                  }}>
                    Iniciar Sesión
                  </Typography>
                </motion.div>
                <motion.div variants={itemVariants}>
                  <Typography variant="subtitle1" align="center" sx={{ 
                    marginTop: '0.75rem',
                    opacity: 0.9,
                    fontWeight: '300',
                    letterSpacing: '0.5px'
                  }}>
                    Bienvenido a Distribuciones Romero
                  </Typography>
                </motion.div>
              </Grid>
              
              <Grid item sx={{ width: '100%' }}>
                <form onSubmit={handleSubmit}>
                  {errorMessage && (
                    <Fade in={!!errorMessage}>
                      <Alert severity="error" sx={{ 
                        mb: 2,
                        borderRadius: '10px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        '& .MuiAlert-icon': {
                          color: '#ff3d00'
                        }
                      }}>
                        {errorMessage}
                      </Alert>
                    </Fade>
                  )}
                  
                  <motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      label="Usuario"
                      variant="outlined"
                      margin="normal"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon sx={{ color: 'rgba(255, 107, 53, 0.8)' }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'transparent',
                            transition: 'all 0.2s ease-in-out',
                          },
                          '&:hover fieldset': {
                            borderColor: '#FF6B35',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF6B35',
                            borderWidth: '2px'
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#FF6B35'
                        },
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        }
                      }}
                      required
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <TextField
                      fullWidth
                      label="Contraseña"
                      variant="outlined"
                      margin="normal"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <LockIcon sx={{ color: 'rgba(255, 107, 53, 0.8)' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="toggle password visibility"
                              onClick={handleTogglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                            </IconButton>
                          </InputAdornment>
                        )
                      }}
                      sx={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.92)',
                        borderRadius: '12px',
                        '& .MuiOutlinedInput-root': {
                          '& fieldset': {
                            borderColor: 'transparent',
                            transition: 'all 0.2s ease-in-out',
                          },
                          '&:hover fieldset': {
                            borderColor: '#FF6B35',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#FF6B35',
                            borderWidth: '2px'
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.7)'
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: '#FF6B35'
                        },
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        transition: 'transform 0.2s ease-in-out',
                        '&:hover': {
                          transform: 'translateY(-2px)'
                        }
                      }}
                      required
                    />
                  </motion.div>
                  
                  <motion.div variants={itemVariants}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      my: 1.5
                    }}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            sx={{ 
                              color: 'rgba(255, 215, 0, 0.7)',
                              '&.Mui-checked': {
                                color: '#FFD700',
                              }
                            }}
                          />
                        }
                        label={
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: 'rgba(255, 255, 255, 0.9)',
                              fontSize: '0.875rem'
                            }}
                          >
                            Recordarme
                          </Typography>
                        }
                      />
                    </Box>
                  </motion.div>
                  
                  <motion.div 
                    variants={itemVariants}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={loading}
                      startIcon={loading ? null : <LoginIcon />}
                      sx={{
                        marginTop: '1.5rem',
                        padding: '12px',
                        backgroundColor: '#FF6B35',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        borderRadius: '12px',
                        boxShadow: '0 4px 14px rgba(255, 107, 53, 0.4)',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          backgroundColor: '#E65A2E',
                          boxShadow: '0 6px 20px rgba(255, 107, 53, 0.6)',
                          transform: 'translateY(-2px)'
                        },
                        '&:active': {
                          transform: 'translateY(1px)',
                          boxShadow: '0 2px 10px rgba(255, 107, 53, 0.4)'
                        }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Ingresar'}
                    </Button>
                  </motion.div>
                </form>
              </Grid>
              
              <Grid item>
                <motion.div 
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                >
                  <Link 
                    href="#" 
                    variant="body2" 
                    onClick={handleOpenRecovery}
                    sx={{ 
                      color: '#FFD700',
                      fontWeight: 500,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </motion.div>
              </Grid>
              
              <Grid item>
                <motion.div variants={itemVariants}>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 2 }}>
                    © {new Date().getFullYear()} Distribuciones Romero. Todos los derechos reservados.
                  </Typography>
                </motion.div>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
      </Container>
      
      {recoveryModal}
    </div>
  );
};

export default Login; 
