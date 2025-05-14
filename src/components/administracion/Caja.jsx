import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Typography, Grid, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Chip, FormControl, InputLabel, Select, MenuItem,
  Box, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress
} from '@mui/material';
import { 
   AttachMoney, Add, Receipt, AccountBalanceWallet, ShowChart, Dashboard, Edit, Delete, Visibility
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TasaCambio from '../TasaCambio';
import moment from 'moment-timezone';
import 'moment-timezone';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

// Funciones de utilidad
const dateUtils = {
  toUTC: (fecha) => {
    if (!fecha) return null;
    return moment.utc(fecha).format('YYYY-MM-DD');
  },
  formatForDisplay: (fecha) => {
    if (!fecha) return 'No disponible';
    try {
      return moment.utc(fecha).format('DD/MM/YYYY');
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error de formato';
    }
  },
  compareDates: (fecha1, fecha2) => {
    return moment.utc(fecha1).valueOf() - moment.utc(fecha2).valueOf();
  }
};

const formatMonetaryValue = (value, currency) => {
  if (value === undefined || value === null) return '-';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '-';
  return `${currency === 'USD' ? '$' : 'Bs'} ${numValue.toFixed(2)}`;
};

const formatEquivalentValue = (value, moneda, tasa) => {
  if (value === undefined || value === null || !tasa) return '-';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '-';
  const equivalent = moneda === 'USD' ? numValue * tasa : numValue / tasa;
  return `${moneda === 'USD' ? 'Bs' : '$'} ${equivalent.toFixed(2)}`;
};

const normalizarTransaccion = (transaccion) => {
  if (!transaccion) return null;

  // Asegurarse de que tenemos un ID válido
  const id = transaccion._id || transaccion.id;
  if (!id) {
    console.warn('Transacción sin ID:', transaccion);
    return null;
  }

  // Validar y normalizar la fecha
  let fecha;
  try {
    fecha = new Date(transaccion.fecha);
    if (isNaN(fecha.getTime())) {
      console.warn('Fecha inválida:', transaccion.fecha);
      return null;
    }
  } catch (error) {
    console.warn('Error al procesar fecha:', error);
    return null;
  }

  // Validar campos requeridos
  if (!transaccion.concepto || !transaccion.moneda) {
    console.warn('Campos requeridos faltantes:', transaccion);
    return null;
  }

  return {
    _id: id,
    fecha: fecha.toISOString(),
    concepto: transaccion.concepto.trim(),
    moneda: transaccion.moneda,
    entrada: parseFloat(transaccion.entrada) || 0,
    salida: parseFloat(transaccion.salida) || 0,
    saldo: parseFloat(transaccion.saldo) || 0,
    tasaCambio: parseFloat(transaccion.tasaCambio) || 1
  };
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

const TransactionTable = ({ transactions, currencyFilter, dateFilter, tasaActual, onEdit, onDelete }) => {
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);

  const handleViewTransaction = async (id) => {
    if (!id) {
      toast.error('ID de transacción no válido');
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/caja/transacciones/${id}`);
      
      if (!response.data || !response.data.transaccion) {
        throw new Error('Respuesta del servidor inválida');
      }

      const transaccionNormalizada = normalizarTransaccion(response.data.transaccion);
      
      if (!transaccionNormalizada) {
        throw new Error('Error al procesar la transacción');
      }

      setSelectedTransaction(transaccionNormalizada);
      setViewModalOpen(true);
    } catch (error) {
      console.error('Error al cargar transacción:', error);
      toast.error(error.response?.data?.message || 'Error al cargar la transacción');
    }
  };

  const handleAction = (action, transaction) => {
    const id = transaction._id || transaction.id;
    if (!id) {
      toast.error('ID de transacción no válido');
      return;
    }
    action(transaction);
  };

  const filteredTransactions = transactions
    .map(t => normalizarTransaccion(t))
    .filter(t => t !== null)
    .filter(t => {
      const transactionDate = new Date(t.fecha);
      const start = dateFilter.start && new Date(dateFilter.start);
      const end = dateFilter.end && new Date(dateFilter.end);
      
      const matchesCurrency = currencyFilter === 'TODAS' || t.moneda === currencyFilter;
      
      return matchesCurrency &&
             (!start || transactionDate >= start) &&
             (!end || transactionDate <= end);
    });

  return (
    <>
      <TableContainer component={Paper} sx={{ mt: 3, borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: 'background.default' }}>
            <TableRow>
              {['Fecha', 'Concepto', 'Moneda', 'Entrada', 'Salida', 'Equivalente', 'Saldo', 'Acciones'].map(header => (
                <TableCell key={header} sx={{ fontWeight: 'bold' }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((t) => (
              <TableRow key={t._id} hover>
                <TableCell>
                  {dateUtils.formatForDisplay(t.fecha)}
                </TableCell>
                <TableCell>{t.concepto}</TableCell>
                <TableCell>
                  <Chip 
                    label={t.moneda} 
                    color={t.moneda === 'USD' ? 'primary' : 'secondary'} 
                    variant="outlined" 
                  />
                </TableCell>
                <TableCell sx={{ color: 'success.main', fontWeight: 700 }}>
                  {t.entrada > 0 ? formatMonetaryValue(t.entrada, t.moneda) : '-'}
                </TableCell>
                <TableCell sx={{ color: 'error.main', fontWeight: 700 }}>
                  {t.salida > 0 ? formatMonetaryValue(t.salida, t.moneda) : '-'}
                </TableCell>
                <TableCell>
                  {formatEquivalentValue(
                    t.entrada || t.salida,
                    t.moneda,
                    tasaActual
                  )}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {formatMonetaryValue(t.saldo, t.moneda)}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      size="small" 
                      color="info"
                      onClick={() => handleAction(handleViewTransaction, t)}
                      title="Ver detalles"
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="primary"
                      onClick={() => handleAction(onEdit, t)}
                      title="Editar"
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error"
                      onClick={() => handleAction(onDelete, t)}
                      title="Eliminar"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog 
        open={viewModalOpen} 
        onClose={() => setViewModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Detalles de la Transacción
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Fecha
                  </Typography>
                  <Typography variant="body1">
                    {dateUtils.formatForDisplay(selectedTransaction.fecha)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Concepto
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.concepto}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Moneda
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.moneda}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tasa de Cambio
                  </Typography>
                  <Typography variant="body1">
                    {selectedTransaction.tasaCambio.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Entrada
                  </Typography>
                  <Typography variant="body1" color="success.main">
                    {selectedTransaction.entrada > 0 
                      ? formatMonetaryValue(selectedTransaction.entrada, selectedTransaction.moneda)
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Salida
                  </Typography>
                  <Typography variant="body1" color="error.main">
                    {selectedTransaction.salida > 0 
                      ? formatMonetaryValue(selectedTransaction.salida, selectedTransaction.moneda)
                      : '-'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Saldo
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {formatMonetaryValue(selectedTransaction.saldo, selectedTransaction.moneda)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewModalOpen(false)}>
            Cerrar
          </Button>
          {selectedTransaction && (
            <Button 
              color="primary" 
              onClick={() => {
                setViewModalOpen(false);
                onEdit(selectedTransaction);
              }}
            >
              Editar
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
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
    modalOpen: false,
    nuevaTransaccion: {
      fecha: moment.utc().format('YYYY-MM-DD'),
      concepto: '',
      moneda: 'USD',
      tipo: 'entrada',
      monto: '',
      tasaCambio: 0
    },
    editingTransaction: null,
    excelFile: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const theme = useTheme();

  // Función para validar y procesar las transacciones
  const procesarTransacciones = (transacciones) => {
    if (!Array.isArray(transacciones)) {
      console.error('Las transacciones no son un array:', transacciones);
      return [];
    }

    return transacciones.map(t => {
      try {
        // Validar y normalizar el ID
        const id = t._id || t.id;
        if (!id) {
          console.warn('Transacción sin ID:', t);
          return null;
        }

        // Validar y normalizar la fecha
        let fecha;
        try {
          fecha = new Date(t.fecha);
          if (isNaN(fecha.getTime())) {
            console.warn('Fecha inválida:', t.fecha);
            return null;
          }
        } catch (error) {
          console.warn('Error al procesar fecha:', error);
          return null;
        }

        // Validar otros campos requeridos
        if (!t.concepto || !t.moneda) {
          console.warn('Campos requeridos faltantes:', t);
          return null;
        }

        // Normalizar valores numéricos
        const entrada = parseFloat(t.entrada) || 0;
        const salida = parseFloat(t.salida) || 0;
        const saldo = parseFloat(t.saldo) || 0;

        return {
          _id: id,
          fecha: fecha.toISOString(),
          concepto: t.concepto.trim(),
          moneda: t.moneda,
          entrada,
          salida,
          saldo,
          tasaCambio: parseFloat(t.tasaCambio) || 1
        };
      } catch (error) {
        console.error('Error al procesar transacción:', error, t);
        return null;
      }
    }).filter(t => t !== null);
  };

  // Función para cargar datos iniciales
  const fetchInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [cajaRes, tasaRes] = await Promise.all([
        axios.get(`${API_URL}/caja`),
        axios.get(`${API_URL}/tasa-cambio`)
      ]);
      
      if (!cajaRes.data) {
        throw new Error('Respuesta del servidor inválida');
      }

      const transaccionesProcesadas = procesarTransacciones(cajaRes.data.transacciones || []);
      
      if (transaccionesProcesadas.length === 0) {
        console.warn('No se encontraron transacciones válidas');
      }

      // Ordenar por fecha descendente
      const transaccionesOrdenadas = transaccionesProcesadas.sort((a, b) => 
        new Date(b.fecha) - new Date(a.fecha)
      );
      
      setState(prev => ({
        ...prev,
        transacciones: transaccionesOrdenadas,
        saldos: cajaRes.data.saldos || { USD: 0, Bs: 0 },
        tasaCambio: tasaRes.data.tasa || 1,
        nuevaTransaccion: {
          ...prev.nuevaTransaccion,
          tasaCambio: tasaRes.data.tasa || 1
        }
      }));
    } catch (error) {
      console.error('Error al cargar datos:', error);
      const errorMessage = error.response?.data?.message || 'Error al cargar los datos';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleRegistrarMovimiento = async () => {
    try {
      const movimiento = {
        ...state.nuevaTransaccion,
        fecha: dateUtils.toUTC(state.nuevaTransaccion.fecha),
        monto: parseFloat(state.nuevaTransaccion.monto),
        entrada: state.nuevaTransaccion.tipo === 'entrada' ? parseFloat(state.nuevaTransaccion.monto) : 0,
        salida: state.nuevaTransaccion.tipo === 'salida' ? parseFloat(state.nuevaTransaccion.monto) : 0,
        tasaCambio: state.tasaCambio
      };

      let res;
      if (state.editingTransaction) {
        res = await axios.put(`${API_URL}/caja/transacciones/${state.editingTransaction._id}`, movimiento);
        toast.success('Movimiento actualizado exitosamente!');
      } else {
        res = await axios.post(`${API_URL}/caja/transacciones`, movimiento);
        toast.success('Movimiento registrado exitosamente!');
      }

      // Obtener y ordenar transacciones actualizadas
      const cajaRes = await axios.get(`${API_URL}/caja`);
      const transaccionesOrdenadas = Array.isArray(cajaRes.data.transacciones)
        ? cajaRes.data.transacciones.sort((a, b) => dateUtils.compareDates(a.fecha, b.fecha))
        : [];

      let currentSaldo = 0;
      const transaccionesConSaldo = transaccionesOrdenadas.map(t => {
        currentSaldo += t.entrada - t.salida;
        return { ...t, saldo: currentSaldo };
      });

      setState(prev => ({
        ...prev,
        transacciones: transaccionesConSaldo,
        saldos: cajaRes.data.saldos,
        modalOpen: false,
        nuevaTransaccion: {
          fecha: moment.utc().format('YYYY-MM-DD'),
          concepto: '',
          moneda: 'USD',
          tipo: 'entrada',
          monto: '',
          tasaCambio: state.tasaCambio
        },
        editingTransaction: null
      }));
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

  // Función para manejar la edición de transacciones
  const handleEditTransaction = (transaction) => {
    const transaccionNormalizada = normalizarTransaccion(transaction);
    if (!transaccionNormalizada) {
      toast.error('Transacción no válida');
      return;
    }

    setState(prev => ({
      ...prev,
      modalOpen: true,
      editingTransaction: transaccionNormalizada,
      nuevaTransaccion: {
        fecha: dateUtils.toUTC(transaccionNormalizada.fecha),
        concepto: transaccionNormalizada.concepto,
        moneda: transaccionNormalizada.moneda,
        tipo: transaccionNormalizada.entrada > 0 ? 'entrada' : 'salida',
        monto: (transaccionNormalizada.entrada || transaccionNormalizada.salida).toString(),
        tasaCambio: transaccionNormalizada.tasaCambio
      }
    }));
  };

  // Función para manejar la eliminación de transacciones
  const handleDeleteTransaction = async (transactionId) => {
    if (!transactionId) {
      toast.error('ID de transacción no válido');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar este movimiento?')) {
      return;
    }

    setLoading(true);
    try {
      const res = await axios.delete(`${API_URL}/caja/transacciones/${transactionId}`);
      
      if (!res.data) {
        throw new Error('Respuesta del servidor inválida');
      }

      const transaccionesProcesadas = procesarTransacciones(res.data.transacciones || []);
      
      setState(prev => ({
        ...prev,
        transacciones: transaccionesProcesadas,
        saldos: res.data.saldos || prev.saldos
      }));
      
      toast.success('Movimiento eliminado exitosamente');
    } catch (error) {
      console.error('Error al eliminar:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar el movimiento');
    } finally {
      setLoading(false);
    }
  };

  const corregirFechas = async () => {
    if (window.confirm('¿Está seguro de corregir las fechas? Se sumarán 4 días a todas las fechas.')) {
      try {
        const res = await axios.post(`${API_URL}/caja/corregir-fechas`);
        
        // Ordenar las transacciones por fecha ascendente
        const transaccionesOrdenadas = res.data.transacciones.sort((a, b) => 
          new Date(a.fecha) - new Date(b.fecha)
        );
        
        let currentSaldo = 0;
        const transaccionesConSaldo = transaccionesOrdenadas.map(t => {
          currentSaldo += t.entrada - t.salida;
          return { ...t, saldo: currentSaldo };
        });

        setState(prev => ({
          ...prev,
          transacciones: transaccionesConSaldo
        }));
        
        toast.success('Fechas corregidas exitosamente');
      } catch (error) {
        toast.error('Error al corregir las fechas');
        console.error('Error:', error);
      }
    }
  };

  const handleImportarExcel = async () => {
    if (!state.excelFile) {
      toast.error('Por favor seleccione un archivo Excel');
      return;
    }

    const formData = new FormData();
    formData.append('file', state.excelFile);

    try {
      toast.info('Importando datos...');
      const res = await axios.post(`${API_URL}/caja/importar-excel`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (res.data.transacciones && res.data.transacciones.length > 0) {
        const transaccionesOrdenadas = res.data.transacciones.sort((a, b) =>
          new Date(a.fecha) - new Date(b.fecha)
        );
        setState(prev => ({
          ...prev,
          transacciones: transaccionesOrdenadas,
          saldos: res.data.saldos,
          excelFile: null
        }));
        toast.success('Datos importados correctamente');
      } else {
        console.error('Respuesta del servidor:', res.data);
        toast.error('No se encontraron transacciones válidas en el archivo');
      }
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error al importar el archivo');
    }
  };

  const formatearFechaSimple = (fechaString) => {
    return dateUtils.formatForDisplay(fechaString);
  };

  // Renderizado condicional para mostrar estado de carga o error
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          onClick={fetchInitialData}
          sx={{ mt: 2 }}
        >
          Reintentar
        </Button>
      </Box>
    );
  }

  return (
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
          <SummaryCard
            title="Saldo en Dólares"
            value={state.saldos.USD}
            currency="$"
            icon={AttachMoney}
            color="success"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Saldo en Bolívares"
            value={state.saldos.Bs}
            subvalue={`Ref: $ ${(state.saldos.Bs / state.tasaCambio).toFixed(2)}`}
            currency="Bs"
            icon={AttachMoney}
            color="info"
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <SummaryCard
            title="Valor Total Consolidado"
            value={totalCajaUSD}
            subvalue={`Bs ${(totalCajaUSD * state.tasaCambio).toFixed(2)}`}
            currency="$"
            icon={ShowChart}
            color="warning"
          />
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
              <Box>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setState(prev => ({ ...prev, excelFile: e.target.files[0] }))}
                  style={{ display: 'none' }}
                  id="excel-file"
                />
                <label htmlFor="excel-file">
                  <Button
                    variant="outlined"
                    color="primary"
                    component="span"
                    sx={{ mr: 2 }}
                  >
                    Seleccionar Excel
                  </Button>
                </label>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleImportarExcel}
                  sx={{ mr: 2 }}
                >
                  Importar Excel
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => setState(prev => ({ ...prev, modalOpen: true }))}
                >
                  Nuevo Movimiento
                </Button>
              </Box>
            </Box>
            
            <TransactionTable 
              transactions={state.transacciones}
              currencyFilter={state.filtros.moneda}
              dateFilter={state.filtros.fecha}
              tasaActual={state.tasaCambio}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={state.modalOpen} onClose={() => setState(prev => ({ ...prev, modalOpen: false }))} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          bgcolor: theme.palette.background.paper,
          display: 'flex', 
          alignItems: 'center', 
          gap: 1 
        }}>
          <Receipt /> 
          <span>Registrar Movimiento</span>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: theme.palette.background.paper }}>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Fecha"
                  type="date"
                  fullWidth
                  value={state.nuevaTransaccion.fecha}
                  onChange={(e) => {
                    const fechaSeleccionada = e.target.value;
                    setState(prev => ({ 
                      ...prev, 
                      nuevaTransaccion: { 
                        ...prev.nuevaTransaccion, 
                        fecha: fechaSeleccionada 
                      } 
                    }));
                  }}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Concepto"
                  fullWidth
                  value={state.nuevaTransaccion.concepto}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    nuevaTransaccion: { ...prev.nuevaTransaccion, concepto: e.target.value } 
                  }))}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Moneda</InputLabel>
                  <Select
                    value={state.nuevaTransaccion.moneda}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      nuevaTransaccion: { ...prev.nuevaTransaccion, moneda: e.target.value } 
                    }))}
                  >
                    <MenuItem value="USD">USD</MenuItem>
                    <MenuItem value="Bs">Bs</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Tipo de Movimiento</InputLabel>
                  <Select
                    value={state.nuevaTransaccion.tipo}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      nuevaTransaccion: { ...prev.nuevaTransaccion, tipo: e.target.value } 
                    }))}
                  >
                    <MenuItem value="entrada">Entrada</MenuItem>
                    <MenuItem value="salida">Salida</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  label="Monto"
                  type="number"
                  fullWidth
                  inputProps={{ min: 0 }}
                  value={state.nuevaTransaccion.monto}
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    nuevaTransaccion: { ...prev.nuevaTransaccion, monto: e.target.value } 
                  }))}
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ bgcolor: theme.palette.background.paper }}>
          <Button onClick={() => setState(prev => ({ ...prev, modalOpen: false }))} color="secondary">
            Cancelar
          </Button>
          <Button onClick={handleRegistrarMovimiento} color="primary" variant="contained">
            Registrar
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CajaInteractiva;