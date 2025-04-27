import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Grid, Paper, TextField,
  Button, IconButton, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Tooltip, CircularProgress, Alert,
  Dialog, DialogActions, DialogContent, DialogTitle,
  InputAdornment, useTheme, useMediaQuery, Divider,
  Card, CardContent, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AttachMoney as MoneyIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  CurrencyExchange as CurrencyIcon,
  History as HistoryIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// API URL
const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel
// Variantes de animación para Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// Componentes estilizados
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
    color: theme.palette.common.white,
    fontSize: '0.95rem',
    whiteSpace: 'nowrap',
    padding: '16px'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.3s ease',
    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)',
  },
  transition: 'all 0.2s ease'
}));

const RateCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.15)',
  }
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '10px',
  textTransform: 'none',
  padding: '8px 16px',
  fontWeight: 'bold',
  boxShadow: '0 3px 5px rgba(0,0,0,0.1)',
  '&:hover': {
    boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)'
  },
  transition: 'all 0.2s ease'
}));

const TasaCambio = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [tasas, setTasas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newRate, setNewRate] = useState('');
  const [currentRate, setCurrentRate] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'
  const [selectedTasa, setSelectedTasa] = useState(null);
  const [error, setError] = useState('');
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // Cargar tasas de cambio
  const fetchTasas = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/tasas-cambio`);
      setTasas(response.data);
      
      // Establecer la tasa actual
      const current = response.data.find(tasa => tasa.activo);
      setCurrentRate(current);
    } catch (error) {
      console.error('Error al cargar tasas de cambio:', error);
      toast.error('Error al cargar tasas de cambio');
    } finally {
      setLoading(false);
    }
  };

  // Efecto para cargar tasas al montar el componente
  useEffect(() => {
    fetchTasas();
  }, []);

  // Manejar apertura del diálogo para añadir tasa
  const handleOpenAddDialog = () => {
    setDialogMode('add');
    setNewRate('');
    setError('');
    setOpenDialog(true);
  };

  // Manejar apertura del diálogo para editar tasa
  const handleOpenEditDialog = (tasa) => {
    setDialogMode('edit');
    setSelectedTasa(tasa);
    setNewRate(tasa.valor.toString());
    setError('');
    setOpenDialog(true);
  };

  // Manejar cierre del diálogo
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Validar tasa de cambio
  const validateRate = (rate) => {
    if (!rate || rate.trim() === '') {
      setError('La tasa de cambio es requerida');
      return false;
    }
    
    const rateNumber = parseFloat(rate);
    if (isNaN(rateNumber) || rateNumber <= 0) {
      setError('Ingrese un valor numérico positivo');
      return false;
    }
    
    setError('');
    return true;
  };

  // Manejar cambio en el campo de tasa
  const handleRateChange = (e) => {
    const value = e.target.value;
    setNewRate(value);
    if (value) validateRate(value);
  };

  // Añadir nueva tasa de cambio
  const handleAddRate = async () => {
    if (!validateRate(newRate)) return;
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/tasas-cambio`, { valor: parseFloat(newRate) });
      toast.success('Tasa de cambio añadida correctamente');
      setOpenDialog(false);
      fetchTasas();
    } catch (error) {
      console.error('Error al añadir tasa de cambio:', error);
      toast.error('Error al añadir tasa de cambio');
    } finally {
      setLoading(false);
    }
  };

  // Editar tasa de cambio
  const handleEditRate = async () => {
    if (!validateRate(newRate) || !selectedTasa) return;
    
    setLoading(true);
    try {
      await axios.put(`${API_URL}/tasas-cambio/${selectedTasa._id}`, { 
        valor: parseFloat(newRate) 
      });
      toast.success('Tasa de cambio actualizada correctamente');
      setOpenDialog(false);
      fetchTasas();
    } catch (error) {
      console.error('Error al actualizar tasa de cambio:', error);
      toast.error('Error al actualizar tasa de cambio');
    } finally {
      setLoading(false);
    }
  };

  // Eliminar tasa de cambio
  const handleDeleteRate = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta tasa de cambio?')) {
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/tasas-cambio/${id}`);
        toast.success('Tasa de cambio eliminada correctamente');
        fetchTasas();
      } catch (error) {
        console.error('Error al eliminar tasa de cambio:', error);
        toast.error('Error al eliminar tasa de cambio');
      } finally {
        setLoading(false);
      }
    }
  };

  // Activar tasa de cambio
  const handleActivateRate = async (id) => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/tasas-cambio/${id}/activar`);
      toast.success('Tasa de cambio activada correctamente');
      fetchTasas();
    } catch (error) {
      console.error('Error al activar tasa de cambio:', error);
      toast.error('Error al activar tasa de cambio');
    } finally {
      setLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: es });
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0
            }}>
              <Typography 
                variant="h4" 
                component="h1" 
                sx={{ 
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.main'
                }}
              >
                <CurrencyIcon fontSize="large" /> 
                Gestión de Tasas de Cambio
              </Typography>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ActionButton
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpenAddDialog}
                  disabled={loading}
                  sx={{ 
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                  }}
                >
                  Nueva Tasa de Cambio
                </ActionButton>
              </motion.div>
            </Box>
          </Grid>

          {/* Mostrar la tasa de cambio actual */}
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <RateCard>
                <Box sx={{ 
                  p: 1, 
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ color: 'white', fontWeight: 'bold', px: 2 }}
                  >
                    Tasa de Cambio Actual
                  </Typography>
                  <motion.div 
                    animate={{ rotate: [0, 360] }} 
                    transition={{ duration: 1, repeat: 0 }}
                  >
                    <MoneyIcon sx={{ color: 'white', mx: 2 }} />
                  </motion.div>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : currentRate ? (
                    <Box>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        mb: 2
                      }}>
                        <Typography 
                          variant="h3" 
                          component="div" 
                          sx={{ 
                            fontWeight: 'bold',
                            color: 'primary.main',
                            textAlign: 'center'
                          }}
                        >
                          Bs. {currentRate.valor.toFixed(2)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Última actualización:
                        </Typography>
                        <Typography variant="body1">
                          {formatDate(currentRate.updatedAt || currentRate.createdAt)}
                        </Typography>
                      </Box>
                    </Box>
                  ) : (
                    <Alert severity="info" sx={{ borderRadius: '8px' }}>
                      No hay tasa de cambio activa
                    </Alert>
                  )}
                </CardContent>
              </RateCard>
            </motion.div>
          </Grid>

          <Grid item xs={12} md={6}>
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <Paper 
                elevation={3} 
                sx={{ 
                  p: 3, 
                  height: '100%',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                  Acciones Rápidas
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={fetchTasas}
                        disabled={loading}
                        sx={{ 
                          borderRadius: '10px',
                          p: 1.5,
                          borderWidth: '2px',
                          '&:hover': {
                            borderWidth: '2px'
                          }
                        }}
                      >
                        Actualizar Tasas
                      </Button>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        color="info"
                        startIcon={<HistoryIcon />}
                        onClick={() => setHistoryDialogOpen(true)}
                        sx={{ 
                          borderRadius: '10px',
                          p: 1.5,
                          borderWidth: '2px',
                          '&:hover': {
                            borderWidth: '2px'
                          }
                        }}
                      >
                        Ver Historial Completo
                      </Button>
                    </motion.div>
                  </Grid>
                </Grid>
              </Paper>
            </motion.div>
          </Grid>

          {/* Tabla de tasas de cambio recientes */}
          <Grid item xs={12}>
            <motion.div variants={itemVariants}>
              <Paper 
                sx={{ 
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                  mt: 2
                }}
              >
                <Box sx={{ 
                  p: 2, 
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2
                }}>
                  <HistoryIcon sx={{ color: 'white' }} />
                  <Typography 
                    variant="h6" 
                    sx={{ color: 'white', fontWeight: 'bold' }}
                  >
                    Tasas de Cambio Recientes
                  </Typography>
                </Box>
                
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                  </Box>
                ) : tasas.length === 0 ? (
                  <Box sx={{ p: 3 }}>
                    <Alert severity="info" sx={{ borderRadius: '8px' }}>
                      No hay tasas de cambio registradas
                    </Alert>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>Valor (Bs.)</StyledTableCell>
                          <StyledTableCell>Fecha</StyledTableCell>
                          <StyledTableCell>Estado</StyledTableCell>
                          <StyledTableCell align="center">Acciones</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {tasas.slice(0, 5).map((tasa) => (
                            <motion.tr
                              key={tasa._id}
                              variants={itemVariants}
                              initial="hidden"
                              animate="visible"
                              exit={{ opacity: 0, y: 20 }}
                              component={StyledTableRow}
                            >
                              <TableCell sx={{ fontWeight: 'bold' }}>
                                Bs. {tasa.valor.toFixed(2)}
                              </TableCell>
                              <TableCell>
                                {formatDate(tasa.updatedAt || tasa.createdAt)}
                              </TableCell>
                              <TableCell>
                                {tasa.activo ? (
                                  <Chip 
                                    label="Activa" 
                                    color="success" 
                                    size="small"
                                    sx={{ 
                                      fontWeight: 'bold',
                                      boxShadow: '0 2px 5px rgba(76,175,80,0.2)',
                                      borderRadius: '8px'
                                    }}
                                  />
                                ) : (
                                  <Chip 
                                    label="Inactiva" 
                                    color="default" 
                                    size="small"
                                    sx={{ 
                                      fontWeight: 'medium',
                                      borderRadius: '8px'
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell align="center">
                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                  {!tasa.activo && (
                                    <Tooltip title="Activar Tasa">
                                      <IconButton 
                                        color="success"
                                        onClick={() => handleActivateRate(tasa._id)}
                                        disabled={loading}
                                        size="small"
                                        sx={{ 
                                          bgcolor: 'rgba(76,175,80,0.1)',
                                          '&:hover': { 
                                            bgcolor: 'rgba(76,175,80,0.2)'
                                          }
                                        }}
                                      >
                                        <SaveIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                  <Tooltip title="Editar Tasa">
                                    <IconButton 
                                      color="primary"
                                      onClick={() => handleOpenEditDialog(tasa)}
                                      disabled={loading}
                                      size="small"
                                      sx={{ 
                                        bgcolor: 'rgba(33,150,243,0.1)',
                                        '&:hover': { 
                                          bgcolor: 'rgba(33,150,243,0.2)'
                                        }
                                      }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  {!tasa.activo && (
                                    <Tooltip title="Eliminar Tasa">
                                      <IconButton 
                                        color="error"
                                        onClick={() => handleDeleteRate(tasa._id)}
                                        disabled={loading}
                                        size="small"
                                        sx={{ 
                                          bgcolor: 'rgba(244,67,54,0.1)',
                                          '&:hover': { 
                                            bgcolor: 'rgba(244,67,54,0.2)'
                                          }
                                        }}
                                      >
                                        <DeleteIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </Box>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Diálogo para añadir/editar tasa de cambio */}
        <AnimatePresence>
          {openDialog && (
            <Dialog
              open={openDialog}
              onClose={handleCloseDialog}
              PaperComponent={motion.div}
              PaperProps={{
                initial: { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 20 },
                transition: { duration: 0.3 },
                sx: { 
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                }
              }}
              maxWidth="sm"
              fullWidth
            >
              <DialogTitle sx={{ 
                bgcolor: 'primary.main', 
                color: 'white',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold'
              }}>
                {dialogMode === 'add' ? 'Añadir Nueva Tasa de Cambio' : 'Editar Tasa de Cambio'}
                <IconButton 
                  size="small" 
                  onClick={handleCloseDialog}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ pt: 3, pb: 2, px: 3, bgcolor: '#ffffff' }}>
                <Typography variant="body1" gutterBottom>
                  {dialogMode === 'add' 
                    ? 'Ingrese el valor de la nueva tasa de cambio (Bs por $)' 
                    : 'Actualice el valor de la tasa de cambio (Bs por $)'}
                </Typography>
                <TextField
                  autoFocus
                  margin="dense"
                  label="Valor de la Tasa"
                  type="number"
                  fullWidth
                  value={newRate}
                  onChange={handleRateChange}
                  error={!!error}
                  helperText={error}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="primary" />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '10px',
                      mt: 1,
                      bgcolor: '#ffffff'
                    }
                  }}
                  variant="outlined"
                />
              </DialogContent>
              <DialogActions sx={{ p: 2, bgcolor: '#ffffff' }}>
                <Button 
                  onClick={handleCloseDialog}
                  variant="outlined"
                  sx={{ 
                    borderRadius: '10px',
                    textTransform: 'none'
                  }}
                >
                  Cancelar
                </Button>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={dialogMode === 'add' ? handleAddRate : handleEditRate}
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={24} /> : <SaveIcon />}
                    sx={{ 
                      borderRadius: '10px',
                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </motion.div>
              </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Diálogo para historial completo */}
        <Dialog
          open={historyDialogOpen}
          onClose={() => setHistoryDialogOpen(false)}
          PaperComponent={motion.div}
          PaperProps={{
            initial: { opacity: 0, scale: 0.9 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.9 },
            transition: { duration: 0.3 },
            sx: { 
              borderRadius: '16px',
              maxWidth: '800px',
              width: '100%',
              maxHeight: '80vh'
            }
          }}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 'bold'
          }}>
            <HistoryIcon />
            Historial Completo de Tasas de Cambio
            <IconButton 
              size="small" 
              onClick={() => setHistoryDialogOpen(false)}
              sx={{ color: 'white', marginLeft: 'auto' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, bgcolor: '#ffffff' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : tasas.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: '8px' }}>
                No hay tasas de cambio registradas
              </Alert>
            ) : (
              <TableContainer sx={{ maxHeight: '60vh' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <StyledTableCell>Valor (Bs.)</StyledTableCell>
                      <StyledTableCell>Fecha de Creación</StyledTableCell>
                      <StyledTableCell>Última Actualización</StyledTableCell>
                      <StyledTableCell>Estado</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {tasas.map((tasa) => (
                        <motion.tr
                          key={tasa._id}
                          variants={itemVariants}
                          initial="hidden"
                          animate="visible"
                          exit={{ opacity: 0 }}
                          component={StyledTableRow}
                        >
                          <TableCell sx={{ fontWeight: 'bold' }}>
                            Bs. {tasa.valor.toFixed(2)}
                          </TableCell>
                          <TableCell>
                            {formatDate(tasa.createdAt)}
                          </TableCell>
                          <TableCell>
                            {formatDate(tasa.updatedAt || tasa.createdAt)}
                          </TableCell>
                          <TableCell>
                            {tasa.activo ? (
                              <Chip 
                                label="Activa" 
                                color="success" 
                                size="small"
                                sx={{ fontWeight: 'bold', borderRadius: '8px' }}
                              />
                            ) : (
                              <Chip 
                                label="Inactiva" 
                                color="default" 
                                size="small"
                                sx={{ borderRadius: '8px' }}
                              />
                            )}
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#ffffff' }}>
            <Button 
              onClick={() => setHistoryDialogOpen(false)}
              variant="outlined"
              sx={{ 
                borderRadius: '10px',
                textTransform: 'none'
              }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer 
          position="bottom-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </Container>
    </motion.div>
  );
};

export default TasaCambio; 