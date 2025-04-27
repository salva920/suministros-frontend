import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Typography, Grid, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Chip, FormControl, InputLabel, Select, MenuItem,
  Box, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TablePagination, Backdrop, IconButton,
  CircularProgress, Alert, AlertTitle, Card, CardContent,
  InputAdornment, Tooltip, Tab, Tabs, useTheme, useMediaQuery,
  Divider
} from '@mui/material';
import { 
   AttachMoney, Add, Receipt, AccountBalanceWallet, ShowChart, Dashboard,
   AddCircle as AddIcon, 
   RemoveCircle as RemoveIcon, 
   Refresh as RefreshIcon,
   LocalAtm as CashIcon,
   DateRange as DateIcon,
   Person as PersonIcon,
   Description as DescriptionIcon,
   Close as CloseIcon,
   TrendingUp as TrendingUpIcon,
   TrendingDown as TrendingDownIcon,
   AccountBalance as AccountIcon,
   Save as SaveIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TasaCambio from '../TasaCambio';
import moment from 'moment-timezone';
import 'moment-timezone';
import { styled } from '@mui/material/styles';

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

const SummaryCard = ({ title, value, currency, subvalue, icon: Icon, color }) => {
  const theme = useTheme();
  
  return (
    <Paper sx={{ 
      p: 3, 
      backgroundColor: theme.palette.background.paper,
      borderLeft: `6px solid ${theme.palette[color].main}`,
      borderRadius: 2,
      boxShadow: theme.shadows[3],
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: 'translateY(-4px)', boxShadow: theme.shadows[6] }
    }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Icon sx={{ fontSize: 40, color: theme.palette[color].main }} />
        <Box>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            {title}
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette[color].dark }}>
            {currency}{value.toFixed(2)}
          </Typography>
          {subvalue && <Typography variant="body2" color="text.secondary">{subvalue}</Typography>}
        </Box>
      </Box>
    </Paper>
  );
};

const TransactionTable = ({ transactions, currencyFilter, dateFilter, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage, tasaActual }) => {
  const filteredTransactions = transactions
    .filter(t => {
      const transactionDate = moment.utc(t.fecha).tz('America/Caracas');
      const start = dateFilter.start && moment.tz(dateFilter.start, 'America/Caracas');
      const end = dateFilter.end && moment.tz(dateFilter.end, 'America/Caracas');
      
      const matchesCurrency = currencyFilter === 'TODAS' || t.moneda === currencyFilter;
      
      return matchesCurrency &&
             (!start || transactionDate.isSameOrAfter(start, 'day')) &&
             (!end || transactionDate.isSameOrBefore(end, 'day'));
    });

  return (
    <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2 }}>
      <Table>
        <TableHead sx={{ bgcolor: 'background.default' }}>
          <TableRow>
            {['Fecha', 'Concepto', 'Moneda', 'Entrada', 'Salida', 'Equivalente', 'Saldo'].map(header => (
              <TableCell key={header} sx={{ fontWeight: 'bold' }}>{header}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((t) => (
            <TableRow key={t._id} hover>
              <TableCell>
                {formatearFechaSimple(t.fecha)}
              </TableCell>
              <TableCell>{t.concepto}</TableCell>
              <TableCell>
                <Chip label={t.moneda} color={t.moneda === 'USD' ? 'primary' : 'secondary'} variant="outlined" />
              </TableCell>
              <TableCell sx={{ color: 'success.main', fontWeight: 700 }}>
                {t.entrada ? `${t.moneda === 'USD' ? '$' : 'Bs'} ${t.entrada.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell sx={{ color: 'error.main', fontWeight: 700 }}>
                {t.salida ? `${t.moneda === 'USD' ? '$' : 'Bs'} ${t.salida.toFixed(2)}` : '-'}
              </TableCell>
              <TableCell>
                {t.moneda === 'USD' 
                  ? `Bs ${((t.entrada || t.salida) * tasaActual).toFixed(2)}` 
                  : `$ ${((t.entrada || t.salida) / tasaActual).toFixed(2)}`}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {t.saldo ? `${t.moneda === 'USD' ? '$' : 'Bs'} ${t.saldo.toFixed(2)}` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTransactions.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </TableContainer>
  );
};

// Función simple para formatear fecha (sin usar moment.js)
const formatearFechaSimple = (fechaString) => {
  if (!fechaString) return 'No disponible';
  
  try {
    // Crear una fecha a partir del string
    const fecha = new Date(fechaString);
    
    // Verificar si la fecha es válida
    if (isNaN(fecha.getTime())) return 'Fecha inválida';
    
    // Extraer día, mes y año
    const dia = fecha.getDate();
    const mes = fecha.getMonth() + 1; // getMonth() devuelve 0-11
    const anio = fecha.getFullYear();
    
    // Formatear como DD/MM/YYYY
    return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${anio}`;
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return 'Error de formato';
  }
};

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

const CashCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  height: '100%',
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

const TabPanel = ({ children, value, index, ...other }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const CajaInteractiva = () => {
  const [state, setState] = useState({
    transacciones: [],
    saldos: { USD: 0, Bs: 0 },
    tasaCambio: 0,
    filtros: {
      moneda: 'TODAS',
      fecha: { start: null, end: null }
    },
    pagination: { page: 0, rowsPerPage: 10 },
    modalOpen: false,
    nuevaTransaccion: {
      fecha: new Date().toISOString().split('T')[0],
      concepto: '',
      moneda: 'USD',
      tipo: 'entrada',
      monto: '',
      tasaCambio: 0
    },
    accesoAutorizado: false,
    claveIngresada: ''
  });

  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const claveCorrecta = 'abril';

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [cajaRes, tasaRes] = await Promise.all([
          axios.get(`${API_URL}/caja`),
          axios.get(`${API_URL}/tasa-cambio`)
        ]);
        
        setState(prev => ({
          ...prev,
          transacciones: Array.isArray(cajaRes.data.transacciones) ? cajaRes.data.transacciones : [],
          saldos: cajaRes.data.saldos || { USD: 0, Bs: 0 },
          tasaCambio: tasaRes.data.tasa,
          nuevaTransaccion: {
            ...prev.nuevaTransaccion,
            tasaCambio: tasaRes.data.tasa
          }
        }));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error cargando datos iniciales');
      }
    };

    if (state.accesoAutorizado) fetchInitialData();
  }, [state.accesoAutorizado]);

  const handleRegistrarMovimiento = async () => {
    try {
      const movimiento = {
        ...state.nuevaTransaccion,
        fecha: moment(state.nuevaTransaccion.fecha)
          .tz('America/Caracas')
          .format('YYYY-MM-DD'),
        monto: parseFloat(state.nuevaTransaccion.monto),
        entrada: state.nuevaTransaccion.tipo === 'entrada' ? parseFloat(state.nuevaTransaccion.monto) : 0,
        salida: state.nuevaTransaccion.tipo === 'salida' ? parseFloat(state.nuevaTransaccion.monto) : 0,
        tasaCambio: state.tasaCambio
      };

      const res = await axios.post(`${API_URL}/caja/transacciones`, movimiento);

      setState(prev => ({
        ...prev,
        transacciones: res.data.transacciones,
        saldos: res.data.saldos,
        modalOpen: false,
        nuevaTransaccion: {
          fecha: new Date().toISOString().split('T')[0],
          concepto: '',
          moneda: 'USD',
          tipo: 'entrada',
          monto: '',
          tasaCambio: state.tasaCambio
        }
      }));
      toast.success('Movimiento registrado exitosamente!');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const handleTasaChange = (nuevaTasa) => {
    setState(prev => ({ 
      ...prev, 
      tasaCambio: nuevaTasa,
      nuevaTransaccion: {
        ...prev.nuevaTransaccion,
        tasaCambio: nuevaTasa
      }
    }));
  };

  const totalCajaUSD = state.saldos.USD + (state.saldos.Bs / state.tasaCambio);

  const getResumenMonedas = () => state.transacciones.reduce((acc, t) => {
    if (!acc[t.moneda]) acc[t.moneda] = { entradas: 0, salidas: 0 };
    acc[t.moneda].entradas += t.entrada;
    acc[t.moneda].salidas += t.salida;
    return acc;
  }, {});

  if (!state.accesoAutorizado) {
    return (
      <Backdrop open sx={{ backdropFilter: 'blur(8px)', zIndex: (theme) => theme.zIndex.modal - 1 }}>
        <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <Typography variant="h5" gutterBottom>Acceso Restringido</Typography>
          <TextField
            label="Clave de acceso"
            type="password"
            value={state.claveIngresada}
            onChange={(e) => setState(prev => ({ ...prev, claveIngresada: e.target.value }))}
            sx={{ mb: 2 }}
            fullWidth
          />
          <Button
            variant="contained"
            onClick={() => {
              if (state.claveIngresada === claveCorrecta) {
                setState(prev => ({ ...prev, accesoAutorizado: true }));
                toast.success('Acceso autorizado');
              } else {
                toast.error('Clave incorrecta');
              }
            }}
            fullWidth
          >
            Ingresar
          </Button>
        </Paper>
      </Backdrop>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Button variant="contained" color="primary" onClick={() => navigate('/dashboard')} sx={{ mb: 2 }}>
          <Dashboard sx={{ mr: 1 }} /> Ir al Dashboard
        </Button>

        <Box sx={{ mb: 4, textAlign: 'center', p: 3, bgcolor: 'background.paper', borderRadius: 2 }}>
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            <AccountBalanceWallet sx={{ fontSize: 48, verticalAlign: 'middle', mr: 2 }} />
            Gestión de Caja
          </Typography>
        </Box>

        <TasaCambio onTasaChange={handleTasaChange} />

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <CashCard>
                <CardContent sx={{ 
                  position: 'relative',
                  p: 3,
                  '&:last-child': { pb: 3 },
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    Saldo Actual
                  </Typography>
                  
                  {state.loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Typography variant="h3" component="div" sx={{ 
                      fontWeight: 'bold',
                      color: state.saldos.USD >= 0 ? 'success.main' : 'error.main',
                      mb: 1
                    }}>
                      Bs. {state.saldos.USD.toFixed(2)}
                    </Typography>
                  )}
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                    <IconButton 
                      color="primary" 
                      onClick={() => {
                        setState(prev => ({ ...prev, loading: true }));
                        axios.get(`${API_URL}/caja/saldo`)
                          .then(response => {
                            setState(prev => ({
                              ...prev,
                              saldos: response.data.saldos,
                              loading: false
                            }));
                            toast.success('Saldo actualizado exitosamente!');
                          })
                          .catch(error => {
                            console.error('Error al cargar saldo:', error);
                            toast.error('Error al cargar el saldo de caja');
                          });
                      }}
                      size="small"
                      sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)' }}
                    >
                      <RefreshIcon />
                    </IconButton>
                    <Typography variant="caption" color="text.secondary">
                      Última actualización: {formatearFechaSimple(new Date())}
                    </Typography>
                  </Box>
                </CardContent>
              </CashCard>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <CashCard sx={{ 
                background: 'linear-gradient(135deg, #e8f5e9 0%, #ffffff 100%)',
              }}>
                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon sx={{ color: 'success.main', mr: 1 }} />
                    <Typography variant="h6" color="text.secondary">
                      Registrar Ingreso
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Registre entradas de efectivo, pagos o depósitos en la caja
                  </Typography>
                  
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          modalOpen: true,
                          nuevaTransaccion: {
                            ...prev.nuevaTransaccion,
                            tipo: 'entrada'
                          }
                        }));
                      }}
                      sx={{ 
                        borderRadius: '10px',
                        py: 1.2,
                        background: 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Nuevo Ingreso
                    </Button>
                  </motion.div>
                </CardContent>
              </CashCard>
            </motion.div>
          </Grid>
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <CashCard sx={{ 
                background: 'linear-gradient(135deg, #ffebee 0%, #ffffff 100%)',
              }}>
                <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingDownIcon sx={{ color: 'error.main', mr: 1 }} />
                    <Typography variant="h6" color="text.secondary">
                      Registrar Egreso
                    </Typography>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Registre salidas de efectivo, gastos o pagos a proveedores
                  </Typography>
                  
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<RemoveIcon />}
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          modalOpen: true,
                          nuevaTransaccion: {
                            ...prev.nuevaTransaccion,
                            tipo: 'salida'
                          }
                        }));
                      }}
                      sx={{ 
                        borderRadius: '10px',
                        py: 1.2,
                        background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                        boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Nuevo Egreso
                    </Button>
                  </motion.div>
                </CardContent>
              </CashCard>
            </motion.div>
          </Grid>
        </Grid>

        <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Moneda</InputLabel>
                <Select
                  value={state.filtros.moneda}
                  onChange={(e) => setState(prev => ({
                    ...prev,
                    filtros: { ...prev.filtros, moneda: e.target.value }
                  }))}
                >
                  <MenuItem value="TODAS">Todas</MenuItem>
                  <MenuItem value="USD">Dólares</MenuItem>
                  <MenuItem value="Bs">Bolívares</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Desde"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  filtros: { ...prev.filtros, fecha: { ...prev.filtros.fecha, start: e.target.value } }
                }))}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                label="Hasta"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                onChange={(e) => setState(prev => ({
                  ...prev,
                  filtros: { ...prev.filtros, fecha: { ...prev.filtros.fecha, end: e.target.value } }
                }))}
              />
            </Grid>
          </Grid>
        </Paper>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Distribución de Movimientos</Typography>
              {Object.entries(getResumenMonedas()).map(([moneda, datos]) => (
                <Box key={moneda} sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    {moneda} - Entradas: {datos.entradas.toFixed(2)}, Salidas: {datos.salidas.toFixed(2)}
                  </Typography>
                  <Box display="flex" gap={1} height={10}>
                    <LinearProgress 
                      variant="determinate" 
                      value={(datos.entradas / (datos.entradas + datos.salidas)) * 100} 
                      sx={{ flexGrow: 1, backgroundColor: 'success.light',
                        '& .MuiLinearProgress-bar': { backgroundColor: 'success.main' }}} 
                    />
                    <LinearProgress 
                      variant="determinate" 
                      value={(datos.salidas / (datos.entradas + datos.salidas)) * 100} 
                      sx={{ flexGrow: 1, backgroundColor: 'error.light',
                        '& .MuiLinearProgress-bar': { backgroundColor: 'error.main' }}} 
                    />
                  </Box>
                </Box>
              ))}
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6">Movimientos Recientes</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => setState(prev => ({ ...prev, modalOpen: true }))}
                >
                  Nuevo Movimiento
                </Button>
              </Box>
              
              <TransactionTable 
                transactions={state.transacciones} 
                currencyFilter={state.filtros.moneda} 
                dateFilter={state.filtros.fecha} 
                page={state.pagination.page}
                rowsPerPage={state.pagination.rowsPerPage}
                handleChangePage={(e, newPage) => 
                  setState(prev => ({ 
                    ...prev, 
                    pagination: { 
                      ...prev.pagination, 
                      page: newPage 
                    } 
                  }))
                }
                handleChangeRowsPerPage={(e) => 
                  setState(prev => ({ 
                    ...prev, 
                    pagination: { 
                      page: 0, 
                      rowsPerPage: parseInt(e.target.value, 10) 
                    } 
                  }))
                }
                tasaActual={state.tasaCambio}
              />
            </Paper>
          </Grid>
        </Grid>

        <Dialog open={state.modalOpen} onClose={() => setState(prev => ({ ...prev, modalOpen: false }))} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ 
            bgcolor: state.nuevaTransaccion.tipo === 'entrada' ? 'success.main' : 'error.main', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
            background: state.nuevaTransaccion.tipo === 'entrada' 
              ? 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)'
            : 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
            fontWeight: 'bold'
          }}>
            {state.nuevaTransaccion.tipo === 'entrada' ? 'Registrar Ingreso' : 'Registrar Egreso'}
            <IconButton 
              size="small" 
              onClick={() => setState(prev => ({ ...prev, modalOpen: false }))}
              sx={{ color: 'white' }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ pt: 3, pb: 1, px: 3, bgcolor: '#ffffff' }}>
            {state.error && (
              <Alert severity="error" sx={{ mb: 2, borderRadius: '10px' }}>
                {state.error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  fullWidth
                  label="Monto"
                  type="number"
                  value={state.nuevaTransaccion.monto}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    nuevaTransaccion: { ...prev.nuevaTransaccion, monto: e.target.value } 
                  }))}
                  variant="outlined"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <AttachMoney color={state.nuevaTransaccion.tipo === 'entrada' ? 'success' : 'error'} />
                      </InputAdornment>
                    ),
                    sx: { 
                      borderRadius: '10px',
                      bgcolor: '#ffffff'
                    }
                  }}
                  sx={{ mb: 2 }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Concepto"
                  value={state.nuevaTransaccion.concepto}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    nuevaTransaccion: { ...prev.nuevaTransaccion, concepto: e.target.value } 
                  }))}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Referencia (opcional)"
                  value={state.nuevaTransaccion.referencia}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    nuevaTransaccion: { ...prev.nuevaTransaccion, referencia: e.target.value } 
                  }))}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, justifyContent: 'space-between', bgcolor: '#ffffff' }}>
            <Button 
              onClick={() => setState(prev => ({ ...prev, modalOpen: false }))}
              variant="outlined"
              disabled={state.loading}
              sx={{ 
                borderRadius: '10px',
                textTransform: 'none'
              }}
            >
              Cancelar
            </Button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                color={state.nuevaTransaccion.tipo === 'entrada' ? 'success' : 'error'}
                onClick={handleRegistrarMovimiento}
                disabled={state.loading}
                startIcon={state.loading ? <CircularProgress size={24} /> : <SaveIcon />}
                sx={{ 
                  borderRadius: '10px',
                  px: 3,
                  background: state.nuevaTransaccion.tipo === 'entrada' 
                    ? 'linear-gradient(45deg, #2e7d32 30%, #4caf50 90%)'
                    : 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                  boxShadow: state.nuevaTransaccion.tipo === 'entrada'
                    ? '0 3px 5px 2px rgba(76, 175, 80, .3)'
                    : '0 3px 5px 2px rgba(244, 67, 54, .3)',
                  textTransform: 'none',
                  fontWeight: 'bold'
                }}
              >
                {state.loading ? 'Guardando...' : 'Registrar'}
              </Button>
            </motion.div>
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

export default CajaInteractiva;