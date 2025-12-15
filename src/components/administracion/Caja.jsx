import React, { useState, useEffect, memo, useCallback } from 'react';
import axios from 'axios';
import { 
  Container, Typography, Grid, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, Chip, FormControl, InputLabel, Select, MenuItem,
  Box, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Pagination
} from '@mui/material';
import { 
   AttachMoney, Add, Receipt, AccountBalanceWallet, ShowChart, Dashboard, Edit, Delete, Visibility, FileDownload
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TasaCambio from '../TasaCambio';
import moment from 'moment-timezone';
import 'moment-timezone';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

const crearFormularioMovimiento = (transaccion, tasaCambioActual) => {
  if (transaccion) {
    const normalizada = normalizarTransaccion(transaccion);

    if (!normalizada) {
      return crearFormularioMovimiento(null, tasaCambioActual);
    }

    const montoBase = normalizada.entrada > 0 ? normalizada.entrada : normalizada.salida;

    return {
      fecha: moment.utc(normalizada.fecha).format('YYYY-MM-DD'),
      concepto: normalizada.concepto,
      moneda: normalizada.moneda,
      tipo: normalizada.entrada > 0 ? 'entrada' : 'salida',
      monto: montoBase ? montoBase.toString() : '',
      tasaCambio: normalizada.tasaCambio || tasaCambioActual || 0
    };
  }

  return {
    fecha: moment.utc().format('YYYY-MM-DD'),
    concepto: '',
    moneda: 'USD',
    tipo: 'entrada',
    monto: '',
    tasaCambio: tasaCambioActual || 0
  };
};

// Función para exportar a Excel
const exportarAExcel = (transacciones, filtros, saldos, tasaCambio) => {
  // Filtrar transacciones según los filtros aplicados
  const transaccionesFiltradas = transacciones.filter(t => {
    const transactionDate = new Date(t.fecha);
    const start = filtros.fecha.start && new Date(filtros.fecha.start);
    const end = filtros.fecha.end && new Date(filtros.fecha.end);
    
    const matchesCurrency = filtros.moneda === 'TODAS' || t.moneda === filtros.moneda;
    
    return matchesCurrency &&
           (!start || transactionDate >= start) &&
           (!end || transactionDate <= end);
  });

  // Ordenar transacciones por fecha ascendente (más antiguos primero)
  const transaccionesOrdenadas = [...transaccionesFiltradas].sort((a, b) => {
    return new Date(a.fecha) - new Date(b.fecha);
  });

  // Crear un nuevo libro de trabajo
  const wb = XLSX.utils.book_new();

  // Crear hoja de datos
  const datos = [];

  // Título principal
  datos.push(['REPORTE DE MOVIMIENTOS DE CAJA']);
  datos.push([]); // Línea en blanco

  // Información de resumen con título subrayado (usando guiones bajos)
  datos.push(['═══════════════════════════════════════════════════════════════════════════════']);
  datos.push(['RESUMEN DE SALDOS']);
  datos.push(['═══════════════════════════════════════════════════════════════════════════════']);
  datos.push(['Saldo en Dólares (USD):', `$ ${saldos.USD.toFixed(2)}`]);
  datos.push(['Saldo en Bolívares (Bs):', `Bs ${saldos.Bs.toFixed(2)}`]);
  datos.push(['Tasa de Cambio:', tasaCambio.toFixed(4)]);
  datos.push(['Valor Total Consolidado (USD):', `$ ${(saldos.USD + (saldos.Bs / tasaCambio)).toFixed(2)}`]);
  datos.push([]); // Línea en blanco

  // Información de filtros con título subrayado
  datos.push(['═══════════════════════════════════════════════════════════════════════════════']);
  datos.push(['FILTROS APLICADOS']);
  datos.push(['═══════════════════════════════════════════════════════════════════════════════']);
  datos.push(['Moneda:', filtros.moneda === 'TODAS' ? 'Todas las monedas' : filtros.moneda]);
  if (filtros.fecha.start || filtros.fecha.end) {
    datos.push(['Fecha Desde:', filtros.fecha.start ? dateUtils.formatForDisplay(filtros.fecha.start) : 'No especificada']);
    datos.push(['Fecha Hasta:', filtros.fecha.end ? dateUtils.formatForDisplay(filtros.fecha.end) : 'No especificada']);
  } else {
    datos.push(['Rango de Fechas:', 'Todas las fechas']);
  }
  datos.push(['Total de Movimientos:', transaccionesOrdenadas.length]);
  datos.push([]); // Línea en blanco

  // Encabezados de la tabla con línea subrayada
  datos.push(['═══════════════════════════════════════════════════════════════════════════════']);
  const encabezados = [
    'Fecha',
    'Concepto',
    'Moneda',
    'Entrada',
    'Salida',
    'Equivalente',
    'Saldo',
    'Tasa de Cambio'
  ];
  datos.push(encabezados);
  datos.push(['═══════════════════════════════════════════════════════════════════════════════']);

  // Agregar datos de transacciones
  transaccionesOrdenadas.forEach(t => {
    const equivalente = t.entrada || t.salida 
      ? (t.moneda === 'USD' 
          ? (t.entrada || t.salida) * tasaCambio 
          : (t.entrada || t.salida) / tasaCambio)
      : 0;
    
    datos.push([
      dateUtils.formatForDisplay(t.fecha),
      t.concepto || '',
      t.moneda || '',
      t.entrada > 0 ? parseFloat(t.entrada) : '',
      t.salida > 0 ? parseFloat(t.salida) : '',
      equivalente > 0 ? parseFloat(equivalente.toFixed(2)) : '',
      parseFloat((t.saldo || 0).toFixed(2)),
      parseFloat((t.tasaCambio || tasaCambio).toFixed(4))
    ]);
  });

  // Crear hoja de trabajo
  const ws = XLSX.utils.aoa_to_sheet(datos);

  // Ajustar ancho de columnas
  const colWidths = [
    { wch: 12 }, // Fecha
    { wch: 35 }, // Concepto
    { wch: 10 }, // Moneda
    { wch: 12 }, // Entrada
    { wch: 12 }, // Salida
    { wch: 15 }, // Equivalente
    { wch: 12 }, // Saldo
    { wch: 15 }  // Tasa de Cambio
  ];
  ws['!cols'] = colWidths;

  // Combinar celdas para el título principal
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });

  // Combinar celdas para las líneas de separación
  const filasSeparador = datos
    .map((row, idx) => row[0] && row[0].includes('═') ? idx : -1)
    .filter(idx => idx !== -1);
  
  filasSeparador.forEach(fila => {
    ws['!merges'].push({ s: { r: fila, c: 0 }, e: { r: fila, c: 7 } });
  });

  // Combinar celdas para títulos de sección
  const filaResumen = datos.findIndex(row => row[0] === 'RESUMEN DE SALDOS');
  if (filaResumen > 0) {
    ws['!merges'].push({ s: { r: filaResumen, c: 0 }, e: { r: filaResumen, c: 7 } });
  }

  const filaFiltros = datos.findIndex(row => row[0] === 'FILTROS APLICADOS');
  if (filaFiltros > 0) {
    ws['!merges'].push({ s: { r: filaFiltros, c: 0 }, e: { r: filaFiltros, c: 7 } });
  }

  // Agregar hoja al libro
  XLSX.utils.book_append_sheet(wb, ws, 'Movimientos de Caja');

  // Generar nombre de archivo con fecha y filtros
  const fechaExportacion = moment().format('YYYYMMDD_HHmmss');
  let nombreArchivo = `movimientos_caja_${fechaExportacion}`;
  
  if (filtros.fecha.start || filtros.fecha.end) {
    const fechaInicio = filtros.fecha.start ? moment(filtros.fecha.start).format('YYYYMMDD') : '';
    const fechaFin = filtros.fecha.end ? moment(filtros.fecha.end).format('YYYYMMDD') : '';
    if (fechaInicio || fechaFin) {
      nombreArchivo += `_${fechaInicio}_${fechaFin}`;
    }
  }
  
  nombreArchivo += '.xlsx';

  // Escribir archivo
  XLSX.writeFile(wb, nombreArchivo);
  
  return nombreArchivo;
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
  const filteredTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.fecha);
    const start = dateFilter.start && new Date(dateFilter.start);
    const end = dateFilter.end && new Date(dateFilter.end);
    
    const matchesCurrency = currencyFilter === 'TODAS' || t.moneda === currencyFilter;
    
    return matchesCurrency &&
           (!start || transactionDate >= start) &&
           (!end || transactionDate <= end);
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
          {filteredTransactions.map((t) => (
            <TableRow key={t._id || t.id} hover>
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
                {t.entrada || t.salida ? 
                  formatMonetaryValue(
                    t.moneda === 'USD' ? 
                      (t.entrada || t.salida) * tasaActual : 
                      (t.entrada || t.salida) / tasaActual,
                    t.moneda === 'USD' ? 'Bs' : 'USD'
                  ) 
                  : '-'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700 }}>
                {formatMonetaryValue(t.saldo, t.moneda)}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    size="small" 
                    color="primary"
                    onClick={() => onEdit(t)}
                    title="Editar"
                  >
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton 
                    size="small" 
                    color="error"
                    onClick={() => onDelete(t._id || t.id)}
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
  );
};

// Formulario de nueva transacción como componente hijo
const MovimientoForm = ({
  open,
  onClose,
  onSubmit,
  initialData,
  tasaCambio,
  isEditing
}) => {
  const [form, setForm] = useState(initialData || crearFormularioMovimiento(null, tasaCambio));

  useEffect(() => {
    setForm(initialData || crearFormularioMovimiento(null, tasaCambio));
  }, [initialData, open, tasaCambio]);

  const montoValido = form.monto !== '' && parseFloat(form.monto) > 0;
  const tasaCambioValida = form.tasaCambio !== '' && parseFloat(form.tasaCambio) > 0;
  const puedeRegistrar = Boolean(form.fecha && form.concepto?.trim() && form.moneda && form.tipo) && montoValido && tasaCambioValida;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEditing ? 'Editar Movimiento' : 'Registrar Movimiento'}</DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Fecha"
                type="date"
                fullWidth
                value={form.fecha}
                onChange={(e) => setForm(prev => ({ ...prev, fecha: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Concepto"
                fullWidth
                value={form.concepto}
                onChange={(e) => setForm(prev => ({ ...prev, concepto: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Moneda</InputLabel>
                <Select
                  value={form.moneda}
                  onChange={(e) => setForm(prev => ({ ...prev, moneda: e.target.value }))}
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
                  value={form.tipo}
                  onChange={(e) => setForm(prev => ({ ...prev, tipo: e.target.value }))}
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
                value={form.monto}
                onChange={(e) => setForm(prev => ({ ...prev, monto: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Tasa de Cambio"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: '0.0001' }}
                value={form.tasaCambio}
                onChange={(e) => setForm(prev => ({ ...prev, tasaCambio: e.target.value }))}
                error={!tasaCambioValida}
                helperText={tasaCambioValida ? '' : 'La tasa debe ser mayor a 0'}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancelar</Button>
        <Button 
          onClick={() => onSubmit(form)} 
          color="primary" 
          variant="contained"
          disabled={!puedeRegistrar}
        >
          {isEditing ? 'Guardar Cambios' : 'Registrar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Memoizar la tabla de transacciones
const MemoTransactionTable = memo(TransactionTable);

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
    editingTransaction: null,
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0
    }
  });

  const tasaCambioActual = state.tasaCambio;
  const modalOpen = state.modalOpen;
  const editingTransaction = state.editingTransaction;

  const [nuevaTransaccion, setNuevaTransaccion] = useState(() => crearFormularioMovimiento(null, tasaCambioActual));

  const resetNuevaTransaccion = useCallback(() => {
    setNuevaTransaccion(crearFormularioMovimiento(null, tasaCambioActual));
  }, [tasaCambioActual]);

  useEffect(() => {
    if (!modalOpen || !editingTransaction) {
      setNuevaTransaccion(prev => {
        const nuevaTasa = tasaCambioActual || prev.tasaCambio;
        if (prev.tasaCambio === nuevaTasa) {
          return prev;
        }
        return { ...prev, tasaCambio: nuevaTasa };
      });
    }
  }, [tasaCambioActual, modalOpen, editingTransaction]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const theme = useTheme();

  const fetchData = async (page = 1, moneda = state.filtros.moneda) => {
    setLoading(true);
      try {
        const [cajaRes, tasaRes] = await Promise.all([
        axios.get(`${API_URL}/caja`, {
          params: {
            page,
            limit: state.pagination.limit,
            moneda
          }
        }),
          axios.get(`${API_URL}/tasa-cambio`)
        ]);
        
        if (cajaRes.data && Array.isArray(cajaRes.data.transacciones)) {
          setState(prev => ({
            ...prev,
            transacciones: cajaRes.data.transacciones,
            saldos: cajaRes.data.saldos || { USD: 0, Bs: 0 },
            tasaCambio: tasaRes.data.tasa,
          pagination: {
            ...prev.pagination,
            page,
            total: cajaRes.data.total,
            totalPages: cajaRes.data.totalPages
            }
          }));
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar los datos');
      setError(error.message);
    } finally {
      setLoading(false);
      }
    };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePageChange = (event, newPage) => {
    fetchData(newPage);
  };

  const handleMonedaChange = (e) => {
    const nuevaMoneda = e.target.value;
    setState(prev => ({
      ...prev,
      filtros: { ...prev.filtros, moneda: nuevaMoneda }
    }));
    fetchData(1, nuevaMoneda);
  };

  const handleRegistrarMovimiento = async (formData) => {
    try {
      const montoNumerico = parseFloat(formData.monto);
      if (!formData.monto || Number.isNaN(montoNumerico) || montoNumerico <= 0) {
        toast.error('El monto debe ser mayor a 0');
        return;
      }

      const tasaCambioSeleccionada = parseFloat(formData.tasaCambio || tasaCambioActual);
      if (!tasaCambioSeleccionada || Number.isNaN(tasaCambioSeleccionada) || tasaCambioSeleccionada <= 0) {
        toast.error('Debe indicar una tasa de cambio válida');
        return;
      }

      const movimiento = {
        ...formData,
        concepto: formData.concepto?.trim() || '',
        fecha: dateUtils.toUTC(formData.fecha),
        monto: montoNumerico,
        tasaCambio: tasaCambioSeleccionada
      };

      let res;
      if (editingTransaction && editingTransaction._id) {
        res = await axios.put(`${API_URL}/caja/transacciones/${editingTransaction._id}`, movimiento);
        toast.success('Movimiento actualizado exitosamente!');
      } else {
        res = await axios.post(`${API_URL}/caja/transacciones`, movimiento);
        toast.success('Movimiento registrado exitosamente!');
      }

      if (res.data && res.data.success) {
        setState(prev => ({
          ...prev,
          transacciones: res.data.transacciones,
          saldos: res.data.saldos,
          modalOpen: false,
          editingTransaction: null
        }));
        resetNuevaTransaccion();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error al procesar la transacción');
    }
  };

  const handleTasaChange = (nuevaTasa) => {
    setState(prev => ({ 
      ...prev, 
        tasaCambio: nuevaTasa
    }));
  };

  // Calcular el último saldo de cada moneda
  const getUltimoSaldo = (moneda) => {
    const transaccionesMoneda = state.transacciones
      .filter(t => t.moneda === moneda)
      .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    
    return transaccionesMoneda.length > 0 ? transaccionesMoneda[0].saldo : 0;
  };

  // Calcular el valor total consolidado usando los últimos saldos
  const totalCajaUSD = getUltimoSaldo('USD') + (getUltimoSaldo('Bs') / state.tasaCambio);

  // Actualizar el estado de saldos cuando cambian las transacciones
  useEffect(() => {
    if (state.transacciones.length > 0) {
      const saldoUSD = getUltimoSaldo('USD');
      const saldoBs = getUltimoSaldo('Bs');
      
      setState(prev => ({
        ...prev,
        saldos: {
          USD: saldoUSD,
          Bs: saldoBs
        }
      }));
    }
  }, [state.transacciones]);

  const getResumenMonedas = () => state.transacciones.reduce((acc, t) => {
    if (!acc[t.moneda]) acc[t.moneda] = { entradas: 0, salidas: 0 };
    acc[t.moneda].entradas += t.entrada;
    acc[t.moneda].salidas += t.salida;
    return acc;
  }, {});

  const handleEditTransaction = (transaction) => {
    const transactionId = transaction?._id || transaction?.id;

    if (!transaction || !transactionId) {
      toast.error('Transacción inválida');
      return;
    }

    const normalizada = normalizarTransaccion({ ...transaction, _id: transactionId });

    if (!normalizada) {
      toast.error('No se pudo preparar la transacción para editar');
      return;
    }

    setState(prev => ({
      ...prev,
      modalOpen: true,
      editingTransaction: { ...normalizada, _id: transactionId }
    }));
  };

  const handleDeleteTransaction = async (id) => {
    if (!id) {
      toast.error('ID de transacción no válido');
      return;
    }

    if (!window.confirm('¿Está seguro de eliminar este movimiento?')) {
      return;
    }

    try {
      const res = await axios.delete(`${API_URL}/caja/transacciones/${id}`);
      if (res.data && res.data.success) {
        setState(prev => ({
          ...prev,
          transacciones: res.data.transacciones,
          saldos: res.data.saldos
        }));
        toast.success('Movimiento eliminado exitosamente');
      }
    } catch (error) {
      console.error('Error al eliminar:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      toast.error(error.response?.data?.message || 'Error al eliminar el movimiento');
    }
  };

  const handleCloseModal = () => {
    setState(prev => ({
      ...prev,
      modalOpen: false,
      editingTransaction: null
    }));
    resetNuevaTransaccion();
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
          onClick={fetchData}
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

      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          gap: 3
        }}
      >
        <Box
          sx={{
            flex: '1 1 260px',
            textAlign: 'center',
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: theme.shadows[2]
          }}
        >
          <Typography variant="h3" sx={{ fontWeight: 800, color: 'primary.main' }}>
            <AccountBalanceWallet sx={{ fontSize: 48, verticalAlign: 'middle', mr: 2 }} />
            Gestión de Caja
          </Typography>
        </Box>

        <Box sx={{ flex: '0 1 320px' }}>
          <TasaCambio onTasaChange={handleTasaChange} />
        </Box>
      </Box>

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
                onChange={handleMonedaChange}
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button 
                  variant="outlined" 
                  color="success"
                  startIcon={<FileDownload />}
                  onClick={() => {
                    try {
                      const nombreArchivo = exportarAExcel(
                        state.transacciones,
                        state.filtros,
                        state.saldos,
                        state.tasaCambio
                      );
                      toast.success(`Archivo ${nombreArchivo} exportado exitosamente`);
                    } catch (error) {
                      console.error('Error al exportar:', error);
                      toast.error('Error al exportar el archivo Excel');
                    }
                  }}
                >
                  Exportar a Excel
                </Button>
                <Button 
                  variant="contained" 
                  startIcon={<Add />}
                  onClick={() => {
                    resetNuevaTransaccion();
                    setState(prev => ({ ...prev, modalOpen: true, editingTransaction: null }));
                  }}
                >
                  Nuevo Movimiento
                </Button>
              </Box>
            </Box>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <MemoTransactionTable 
              transactions={state.transacciones}
              currencyFilter={state.filtros.moneda}
              dateFilter={state.filtros.fecha}
              tasaActual={state.tasaCambio}
              onEdit={handleEditTransaction}
              onDelete={handleDeleteTransaction}
            />
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination 
                    count={state.pagination.totalPages}
                    page={state.pagination.page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            )}
          </Paper>
        </Grid>
      </Grid>

      <MovimientoForm
        open={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleRegistrarMovimiento}
        initialData={editingTransaction
          ? crearFormularioMovimiento(editingTransaction, editingTransaction.tasaCambio || tasaCambioActual)
          : nuevaTransaccion}
        tasaCambio={tasaCambioActual}
        isEditing={Boolean(editingTransaction)}
      />
    </Container>
  );
};

export default CajaInteractiva;