import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Container, Typography, Grid, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Chip, FormControl, InputLabel, Select, MenuItem,
  Box, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TablePagination, Backdrop, IconButton
} from '@mui/material';
import { 
   AttachMoney, Add, Receipt, AccountBalanceWallet, ShowChart, Dashboard, Edit, Delete
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

const TransactionTable = ({ transactions, currencyFilter, dateFilter, page, rowsPerPage, handleChangePage, handleChangeRowsPerPage, tasaActual, onEdit, onDelete }) => {
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
            {['Fecha', 'Concepto', 'Moneda', 'Entrada', 'Salida', 'Equivalente', 'Saldo', 'Acciones'].map(header => (
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
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit(t)}
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete(t._id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
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
    editingTransaction: null
  });

  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [cajaRes, tasaRes] = await Promise.all([
          axios.get(`${API_URL}/caja`),
          axios.get(`${API_URL}/tasa-cambio`)
        ]);
        
        // Ordenar las transacciones por fecha descendente
        const transaccionesOrdenadas = Array.isArray(cajaRes.data.transacciones) 
          ? cajaRes.data.transacciones.sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
          : [];
        
        setState(prev => ({
          ...prev,
          transacciones: transaccionesOrdenadas,
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

    fetchInitialData();
  }, []);

  const handleRegistrarMovimiento = async () => {
    try {
      // Usar moment para manejar la fecha consistentemente
      const fechaFormateada = moment(state.nuevaTransaccion.fecha)
        .tz('America/Caracas')
        .format('YYYY-MM-DD');

      const movimiento = {
        ...state.nuevaTransaccion,
        fecha: fechaFormateada,
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

      // Obtener la lista actualizada de transacciones
      const cajaRes = await axios.get(`${API_URL}/caja`);
      
      setState(prev => ({
        ...prev,
        transacciones: cajaRes.data.transacciones,
        saldos: cajaRes.data.saldos,
        modalOpen: false,
        nuevaTransaccion: {
          fecha: new Date().toISOString().split('T')[0],
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

  const handleEditTransaction = (transaction) => {
    // Usar moment para manejar la fecha correctamente
    const fechaFormateada = moment(transaction.fecha)
      .tz('America/Caracas')
      .format('YYYY-MM-DD');

    setState(prev => ({
      ...prev,
      modalOpen: true,
      editingTransaction: transaction,
      nuevaTransaccion: {
        fecha: fechaFormateada,
        concepto: transaction.concepto,
        moneda: transaction.moneda,
        tipo: transaction.entrada > 0 ? 'entrada' : 'salida',
        monto: transaction.entrada || transaction.salida,
        tasaCambio: transaction.tasaCambio
      }
    }));
  };

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('¿Está seguro de eliminar este movimiento?')) {
      try {
        const res = await axios.delete(`${API_URL}/caja/transacciones/${transactionId}`);
        setState(prev => ({
          ...prev,
          transacciones: res.data.transacciones,
          saldos: res.data.saldos
        }));
        toast.success('Movimiento eliminado exitosamente');
      } catch (error) {
        toast.error(error.response?.data?.message || 'Error al eliminar el movimiento');
      }
    }
  };

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
              <Button 
                variant="contained" 
                startIcon={<Add />}
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
                  onChange={(e) => setState(prev => ({ 
                    ...prev, 
                    nuevaTransaccion: { ...prev.nuevaTransaccion, fecha: e.target.value } 
                  }))}
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