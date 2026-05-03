import React, { useState, useEffect, memo, useCallback } from 'react';
import axios from 'axios';
import {
  Container, Typography, Grid, Paper, TextField, Button,
  Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, FormControl, InputLabel, Select, MenuItem,
  Box, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, IconButton, CircularProgress, Pagination,
  Divider, Stack
} from '@mui/material';
import {
  AttachMoney, Add, AccountBalanceWallet, ShowChart, Dashboard, Edit, Delete, FileDownload, CurrencyBitcoin, Savings, AccountBalance
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TasaCambio from '../TasaCambio';
import moment from 'moment-timezone';
import 'moment-timezone';
import * as XLSX from 'xlsx';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel
const MONEDAS_CAJA = ['USD', 'Bs', 'ZELLE', 'BINANCE'];
const SALDOS_POR_DEFECTO = { USD: 0, Bs: 0, ZELLE: 0, BINANCE: 0 };
const MONEDA_LABEL = {
  USD: 'Dólares',
  Bs: 'Bolívares',
  ZELLE: 'Zelle',
  BINANCE: 'Binance'
};
const MONEDA_CHIP_SX = {
  USD: { bgcolor: '#E8F5E9', color: '#2E7D32', borderColor: '#A5D6A7' },
  Bs: { bgcolor: '#E3F2FD', color: '#1565C0', borderColor: '#90CAF9' },
  ZELLE: { bgcolor: '#EDE7F6', color: '#5E35B1', borderColor: '#B39DDB' },
  BINANCE: { bgcolor: '#FFF8E1', color: '#B26A00', borderColor: '#FFE082' }
};

const etiquetaPeriodoFiltros = (filtros) => {
  let periodo = '';
  if (filtros.verTodosLosMeses) periodo = 'Todos los meses';
  else if (filtros.mes && filtros.anio) {
    periodo = moment({ year: parseInt(filtros.anio, 10), month: parseInt(filtros.mes, 10) - 1, day: 1 })
      .locale('es')
      .format('MMMM YYYY');
  }
  const extras = [];
  if (filtros.fecha.start) extras.push(`desde ${moment(filtros.fecha.start).format('DD/MM/YYYY')}`);
  if (filtros.fecha.end) extras.push(`hasta ${moment(filtros.fecha.end).format('DD/MM/YYYY')}`);
  if (extras.length) periodo = periodo ? `${periodo} · ${extras.join(' · ')}` : extras.join(' · ');
  const monedaTxt = filtros.moneda === 'TODAS' ? 'Todas las monedas' : (MONEDA_LABEL[filtros.moneda] || filtros.moneda);
  return { periodo: periodo || 'Sin filtro de mes', monedaTxt };
};

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
  const formatted = numValue.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (currency === 'Bs') return `Bs ${formatted}`;
  return `$ ${formatted}`;
};

const formatEquivalentValue = (value, moneda, tasa) => {
  if (value === undefined || value === null || !tasa) return '-';
  const numValue = parseFloat(value);
  if (isNaN(numValue)) return '-';
  const equivalent = ['USD', 'ZELLE', 'BINANCE'].includes(moneda)
    ? numValue * tasa
    : numValue / tasa;
  const simboloOrigenEsDolar = ['USD', 'ZELLE', 'BINANCE'].includes(moneda);
  return `${simboloOrigenEsDolar ? 'Bs' : '$'} ${equivalent.toFixed(2)}`;
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
      ? (['USD', 'ZELLE', 'BINANCE'].includes(t.moneda)
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
  const isDark = theme.palette.mode === 'dark';
  const amount = formatMonetaryValue(value, currency === 'Bs' ? 'Bs' : 'USD');
  return (
    <Paper
      elevation={0}
      sx={{
        height: '100%',
        minHeight: { xs: 132, sm: 144 },
        p: { xs: 1.75, sm: 2 },
        borderRadius: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        background: isDark
          ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
          : theme.palette.background.paper,
        boxShadow: theme.shadows[1],
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          boxShadow: theme.shadows[4],
          borderColor: theme.palette[color].main + '55'
        }
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            flexShrink: 0,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: theme.palette[color].main + '18',
            color: theme.palette[color].main
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', lineHeight: 1.2 }}>
            {title}
          </Typography>
          <Typography
            component="div"
            sx={{
              fontWeight: 800,
              color: theme.palette[color].main,
              letterSpacing: '-0.02em',
              fontSize: { xs: '1rem', sm: '1.15rem', md: '1.2rem' },
              lineHeight: 1.25,
              wordBreak: 'break-word',
              mt: 0.5
            }}
          >
            {amount}
          </Typography>
          {subvalue && (
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, mt: 0.5, display: 'block' }}>
              {subvalue}
            </Typography>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

const TransactionTable = ({ transactions, currencyFilter, dateFilter, tasaActual, onEdit, onDelete, serverFiltered = false }) => {
  const filteredTransactions = serverFiltered
    ? transactions
    : transactions.filter(t => {
        const transactionDate = new Date(t.fecha);
        const start = dateFilter?.start && new Date(dateFilter.start);
        const end = dateFilter?.end && new Date(dateFilter.end);
        const matchesCurrency = currencyFilter === 'TODAS' || t.moneda === currencyFilter;
        return matchesCurrency &&
               (!start || transactionDate >= start) &&
               (!end || transactionDate <= end);
      });

  const theme = useTheme();
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        mt: 2,
        borderRadius: 3,
        border: `1px solid ${theme.palette.divider}`,
        overflowX: 'auto',
        '& .MuiTable-root': { minWidth: { xs: 560, sm: 680 } }
      }}
    >
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {['Fecha', 'Concepto', 'Moneda', 'Entrada', 'Salida', 'Equivalente', 'Saldo', 'Acciones'].map(header => (
              <TableCell
                key={header}
                sx={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  bgcolor: theme.palette.mode === 'dark' ? 'action.hover' : 'grey.50',
                  color: 'text.secondary',
                  py: 1.5,
                  borderBottom: `2px solid ${theme.palette.divider}`
                }}
              >
                {header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredTransactions.map((t) => (
            <TableRow
              key={t._id || t.id}
              hover
              sx={{
                '&:hover': { bgcolor: theme.palette.action.hover + '40' },
                '&:last-child td': { border: 0 }
              }}
            >
              <TableCell sx={{ py: 1.5, fontWeight: 500 }}>
                {dateUtils.formatForDisplay(t.fecha)}
              </TableCell>
              <TableCell sx={{ py: 1.5, maxWidth: 200 }}>{t.concepto}</TableCell>
              <TableCell sx={{ py: 1.5 }}>
                <Chip
                  label={MONEDA_LABEL[t.moneda] || t.moneda}
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    borderWidth: 1,
                    ...MONEDA_CHIP_SX[t.moneda]
                  }}
                />
              </TableCell>
              <TableCell sx={{ color: 'success.main', fontWeight: 700, py: 1.5 }}>
                {t.entrada > 0 ? formatMonetaryValue(t.entrada, t.moneda) : '-'}
              </TableCell>
              <TableCell sx={{ color: 'error.main', fontWeight: 700, py: 1.5 }}>
                {t.salida > 0 ? formatMonetaryValue(t.salida, t.moneda) : '-'}
              </TableCell>
              <TableCell sx={{ py: 1.5 }}>
                {t.entrada || t.salida
                  ? formatMonetaryValue(
                      ['USD', 'ZELLE', 'BINANCE'].includes(t.moneda)
                        ? (t.entrada || t.salida) * tasaActual
                        : (t.entrada || t.salida) / tasaActual,
                      ['USD', 'ZELLE', 'BINANCE'].includes(t.moneda) ? 'Bs' : 'USD'
                    )
                  : '-'}
              </TableCell>
              <TableCell sx={{ fontWeight: 700, py: 1.5 }}>
                {formatMonetaryValue(t.saldo, t.moneda)}
              </TableCell>
              <TableCell sx={{ py: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <IconButton size="small" color="primary" onClick={() => onEdit(t)} title="Editar" sx={{ '&:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' } }}>
                    <Edit fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => onDelete(t._id || t.id)} title="Eliminar" sx={{ '&:hover': { bgcolor: 'error.main', color: 'error.contrastText' } }}>
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

  const theme = useTheme();
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: theme.shadows[24],
          overflow: 'hidden'
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.25rem', borderBottom: `1px solid ${theme.palette.divider}`, py: 2 }}>
        {isEditing ? 'Editar Movimiento' : 'Registrar Movimiento'}
      </DialogTitle>
      <DialogContent sx={{ pt: 3, pb: 2 }}>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Fecha"
              type="date"
              fullWidth
              value={form.fecha}
              onChange={(e) => setForm(prev => ({ ...prev, fecha: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Concepto"
              fullWidth
              value={form.concepto}
              onChange={(e) => setForm(prev => ({ ...prev, concepto: e.target.value }))}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <InputLabel>Moneda</InputLabel>
              <Select value={form.moneda} onChange={(e) => setForm(prev => ({ ...prev, moneda: e.target.value }))} label="Moneda">
                {MONEDAS_CAJA.map(moneda => (
                  <MenuItem key={moneda} value={moneda}>{moneda}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}>
              <InputLabel>Tipo de Movimiento</InputLabel>
              <Select value={form.tipo} onChange={(e) => setForm(prev => ({ ...prev, tipo: e.target.value }))} label="Tipo de Movimiento">
                <MenuItem value="entrada">Entrada</MenuItem>
                <MenuItem value="salida">Salida</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Monto"
              type="number"
              fullWidth
              inputProps={{ min: 0 }}
              value={form.monto}
              onChange={(e) => setForm(prev => ({ ...prev, monto: e.target.value }))}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Tasa de Cambio"
              type="number"
              fullWidth
              inputProps={{ min: 0, step: '0.0001' }}
              value={form.tasaCambio}
              onChange={(e) => setForm(prev => ({ ...prev, tasaCambio: e.target.value }))}
              error={!tasaCambioValida}
              helperText={tasaCambioValida ? '' : 'La tasa debe ser mayor a 0'}
              size="small"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${theme.palette.divider}`, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2 }}>
          Cancelar
        </Button>
        <Button
          onClick={() => onSubmit(form)}
          color="primary"
          variant="contained"
          disabled={!puedeRegistrar}
          sx={{ borderRadius: 2, fontWeight: 600 }}
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
  const now = new Date();
  const [state, setState] = useState({
    transacciones: [],
    saldos: SALDOS_POR_DEFECTO,
    tasaCambio: 0,
    filtros: {
      moneda: 'TODAS',
      fecha: { start: null, end: null },
      // Por defecto filtrar por mes actual para carga rápida
      mes: String(now.getMonth() + 1),
      anio: String(now.getFullYear()),
      verTodosLosMeses: false
    },
    modalOpen: false,
    editingTransaction: null,
    pagination: {
      page: 1,
      limit: 50,
      total: 0,
      totalPages: 0
    },
    saldosMeta: { alCierre: false, fechaCierre: null }
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

  const fetchData = useCallback(async (page = 1, opts = {}) => {
    const {
      moneda = state.filtros.moneda,
      mes = state.filtros.mes,
      anio = state.filtros.anio,
      verTodosLosMeses = state.filtros.verTodosLosMeses,
      fechaStart = state.filtros.fecha.start,
      fechaEnd = state.filtros.fecha.end
    } = opts;
    setLoading(true);
    try {
      const limit = state.pagination.limit;
      const paramsTransacciones = {
        page,
        limit,
        moneda
      };
      if (!verTodosLosMeses && mes && anio) {
        paramsTransacciones.mes = mes;
        paramsTransacciones.anio = anio;
      }
      if (fechaStart) paramsTransacciones.fechaDesde = fechaStart;
      if (fechaEnd) paramsTransacciones.fechaHasta = fechaEnd;
      if (verTodosLosMeses) paramsTransacciones.verTodosLosMeses = 'true';

      const paramsCaja = { ...paramsTransacciones };
      delete paramsCaja.page;
      delete paramsCaja.limit;
      delete paramsCaja.moneda;

      const [cajaRes, tasaRes, transaccionesRes] = await Promise.all([
        axios.get(`${API_URL}/caja`, { params: paramsCaja }),
        axios.get(`${API_URL}/tasa-cambio`),
        axios.get(`${API_URL}/caja/transacciones`, { params: paramsTransacciones })
      ]);

      const data = transaccionesRes.data;
      setState(prev => ({
        ...prev,
        transacciones: Array.isArray(data.transacciones) ? data.transacciones : [],
        saldos: { ...SALDOS_POR_DEFECTO, ...(cajaRes.data?.saldos || {}) },
        saldosMeta: {
          alCierre: Boolean(cajaRes.data?.saldosAlCierre),
          fechaCierre: cajaRes.data?.fechaCierreSaldos || null
        },
        tasaCambio: tasaRes.data?.tasa ?? prev.tasaCambio,
        pagination: {
          ...prev.pagination,
          page: data.page || page,
          total: data.total ?? 0,
          totalPages: data.totalPages ?? 0
        }
      }));
    } catch (err) {
      console.error('Error al cargar datos:', err);
      toast.error('Error al cargar los datos');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [state.filtros.moneda, state.filtros.mes, state.filtros.anio, state.filtros.verTodosLosMeses, state.filtros.fecha.start, state.filtros.fecha.end, state.pagination.limit]);

  useEffect(() => {
    fetchData(1);
  }, []);

  const handlePageChange = (event, newPage) => {
    fetchData(newPage);
  };

  const handleMonedaChange = (e) => {
    const nuevaMoneda = e.target.value;
    setState(prev => ({ ...prev, filtros: { ...prev.filtros, moneda: nuevaMoneda } }));
    fetchData(1, { moneda: nuevaMoneda });
  };

  const handleMesAnioChange = (mes, anio, verTodosLosMeses) => {
    setState(prev => ({
      ...prev,
      filtros: {
        ...prev.filtros,
        mes: mes ?? prev.filtros.mes,
        anio: anio ?? prev.filtros.anio,
        verTodosLosMeses: Boolean(verTodosLosMeses)
      }
    }));
    fetchData(1, { mes, anio, verTodosLosMeses });
  };

  const handleRangoFechasChange = (start, end) => {
    setState(prev => ({
      ...prev,
      filtros: { ...prev.filtros, fecha: { start, end } }
    }));
    fetchData(1, { fechaStart: start, fechaEnd: end });
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
          saldos: res.data.saldos || prev.saldos,
          modalOpen: false,
          editingTransaction: null
        }));
        resetNuevaTransaccion();
        fetchData(state.pagination.page);
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

  // Valor total consolidado desde saldos del backend
  const totalCajaUSD = (
    (state.saldos.USD || 0) +
    (state.saldos.ZELLE || 0) +
    (state.saldos.BINANCE || 0) +
    ((state.saldos.Bs || 0) / (state.tasaCambio || 1))
  );

  const resumenFiltrosTexto = etiquetaPeriodoFiltros(state.filtros);

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
          saldos: res.data.saldos || prev.saldos
        }));
        toast.success('Movimiento eliminado exitosamente');
        fetchData(state.pagination.page);
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
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
          gap: 2
        }}
      >
        <CircularProgress size={48} thickness={4} />
        <Typography color="text.secondary" variant="body2">Cargando caja...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mt: 4,
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            textAlign: 'center'
          }}
        >
          <Typography color="error" variant="h6" sx={{ mb: 1 }}>
            Error al cargar
          </Typography>
          <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
            {error}
          </Typography>
          <Button variant="contained" onClick={() => fetchData(1)} sx={{ borderRadius: 2 }}>
            Reintentar
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1.5, sm: 2 } }}>
      <Button
        variant="outlined"
        startIcon={<Dashboard />}
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
      >
        Ir al Dashboard
      </Button>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          gap: 3,
          mb: 4
        }}
      >
        <Box
          sx={{
            flex: '1 1 260px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: { xs: 'center', md: 'flex-start' },
            gap: 2,
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: 'background.paper'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 2.5, bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <AccountBalanceWallet sx={{ fontSize: 28 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', letterSpacing: '-0.02em' }}>
            Gestión de Caja
          </Typography>
        </Box>
        <Box sx={{ flex: '0 1 320px', minWidth: { xs: '100%', sm: 280 } }}>
          <TasaCambio onTasaChange={handleTasaChange} />
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50'
        }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.9, mb: 1.5 }}>
              Filtros y vista
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                '& > *': { flex: '1 1 160px', minWidth: { xs: '100%', sm: 'calc(50% - 8px)', md: 'min(180px, 20%)' }, maxWidth: { md: '100%' } }
              }}
            >
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}>
                <InputLabel>Moneda</InputLabel>
                <Select value={state.filtros.moneda} onChange={handleMonedaChange} label="Moneda">
                  <MenuItem value="TODAS">Todas</MenuItem>
                  {MONEDAS_CAJA.map(moneda => (
                    <MenuItem key={moneda} value={moneda}>{MONEDA_LABEL[moneda] || moneda}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}>
                <InputLabel>Mes</InputLabel>
                <Select
                  value={state.filtros.verTodosLosMeses ? 'TODOS' : state.filtros.mes}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === 'TODOS') handleMesAnioChange(state.filtros.mes, state.filtros.anio, true);
                    else handleMesAnioChange(v, state.filtros.anio, false);
                  }}
                  label="Mes"
                >
                  <MenuItem value="TODOS">Todos los meses</MenuItem>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <MenuItem key={m} value={String(m)}>{moment().locale('es').month(m - 1).format('MMMM')}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }} disabled={state.filtros.verTodosLosMeses}>
                <InputLabel>Año</InputLabel>
                <Select
                  value={state.filtros.anio}
                  onChange={(e) => handleMesAnioChange(state.filtros.mes, e.target.value, state.filtros.verTodosLosMeses)}
                  label="Año"
                >
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <MenuItem key={y} value={String(y)}>{y}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                label="Desde"
                type="date"
                fullWidth
                size="small"
                value={state.filtros.fecha.start || ''}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => handleRangoFechasChange(e.target.value || null, state.filtros.fecha.end)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
              />
              <TextField
                label="Hasta"
                type="date"
                fullWidth
                size="small"
                value={state.filtros.fecha.end || ''}
                InputLabelProps={{ shrink: true }}
                onChange={(e) => handleRangoFechasChange(state.filtros.fecha.start, e.target.value || null)}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: 'background.paper' } }}
              />
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1.5, alignItems: 'center' }}>
              <Chip size="small" variant="outlined" label={`Período: ${resumenFiltrosTexto.periodo}`} sx={{ fontWeight: 600 }} />
              <Chip size="small" variant="outlined" label={`Moneda tabla: ${resumenFiltrosTexto.monedaTxt}`} sx={{ fontWeight: 600 }} />
              {state.pagination.total > 0 && (
                <Chip size="small" variant="outlined" label={`${state.pagination.total} movimiento(s) en este filtro`} sx={{ fontWeight: 600 }} />
              )}
            </Stack>
          </Box>

          <Divider />

          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.9 }}>
                  {state.saldosMeta.alCierre ? 'Saldos al cierre del período' : 'Saldos actuales de la caja'}
                </Typography>
                {state.saldosMeta.alCierre && state.saldosMeta.fechaCierre && (
                  <Chip
                    size="small"
                    color="info"
                    variant="outlined"
                    label={`Hasta ${moment.utc(state.saldosMeta.fechaCierre).format('DD/MM/YYYY')}`}
                    sx={{ fontWeight: 600 }}
                  />
                )}
              </Stack>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {MONEDAS_CAJA.map(moneda => (
                  <Chip
                    key={moneda}
                    label={MONEDA_LABEL[moneda]}
                    size="small"
                    variant="outlined"
                    sx={{ fontWeight: 700, fontSize: '0.7rem', ...MONEDA_CHIP_SX[moneda] }}
                  />
                ))}
              </Stack>
            </Stack>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                  lg: 'repeat(5, minmax(0, 1fr))'
                }
              }}
            >
              <SummaryCard title="Saldo en Dólares (USD)" value={state.saldos.USD || 0} currency="$" icon={Savings} color="success" />
              <SummaryCard
                title="Saldo en Bolívares"
                value={state.saldos.Bs || 0}
                subvalue={`Ref: ${formatMonetaryValue((state.saldos.Bs || 0) / (state.tasaCambio || 1), 'USD')}`}
                currency="Bs"
                icon={AccountBalance}
                color="info"
              />
              <SummaryCard title="Saldo Zelle" value={state.saldos.ZELLE || 0} currency="$" icon={AttachMoney} color="primary" />
              <SummaryCard title="Saldo Binance" value={state.saldos.BINANCE || 0} currency="$" icon={CurrencyBitcoin} color="secondary" />
              <SummaryCard
                title="Valor total consolidado"
                value={totalCajaUSD}
                subvalue={formatMonetaryValue(totalCajaUSD * (state.tasaCambio || 1), 'Bs')}
                currency="$"
                icon={ShowChart}
                color="warning"
              />
            </Box>
          </Box>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          mb: 3,
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.9 }}>
          Detalle según filtros
        </Typography>
        <Grid container spacing={{ xs: 2, sm: 3 }}>
        <Grid item xs={12} lg={4}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              height: '100%',
              bgcolor: 'background.paper'
            }}
          >
            <Typography variant="subtitle1" sx={{ mb: 2.5, fontWeight: 700 }}>
              Distribución de movimientos
            </Typography>
            {Object.entries(getResumenMonedas()).length === 0 ? (
              <Typography variant="body2" color="text.secondary">Sin movimientos en este período.</Typography>
            ) : (
              Object.entries(getResumenMonedas()).map(([moneda, datos]) => (
                <Box key={moneda} sx={{ mb: 3 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    {MONEDA_LABEL[moneda] || moneda} — Entradas: {datos.entradas.toFixed(2)} · Salidas: {datos.salidas.toFixed(2)}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, height: 8, borderRadius: 1, overflow: 'hidden' }}>
                    <LinearProgress
                      variant="determinate"
                      value={(datos.entradas / (datos.entradas + datos.salidas)) * 100}
                      sx={{ flex: 1, borderRadius: 1, bgcolor: 'success.light', '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }}
                    />
                    <LinearProgress
                      variant="determinate"
                      value={(datos.salidas / (datos.entradas + datos.salidas)) * 100}
                      sx={{ flex: 1, borderRadius: 1, bgcolor: 'error.light', '& .MuiLinearProgress-bar': { bgcolor: 'error.main' } }}
                    />
                  </Box>
                </Box>
              ))
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2, sm: 3 },
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 2,
                mb: 3
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Movimientos</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                <Button
                  variant="outlined"
                  color="success"
                  size="small"
                  startIcon={<FileDownload />}
                  onClick={async () => {
                    try {
                      const params = {
                        limit: 99999,
                        page: 1,
                        moneda: state.filtros.moneda
                      };
                      if (!state.filtros.verTodosLosMeses && state.filtros.mes && state.filtros.anio) {
                        params.mes = state.filtros.mes;
                        params.anio = state.filtros.anio;
                      }
                      if (state.filtros.fecha.start) params.fechaDesde = state.filtros.fecha.start;
                      if (state.filtros.fecha.end) params.fechaHasta = state.filtros.fecha.end;
                      const { data } = await axios.get(`${API_URL}/caja/transacciones`, { params });
                      const todas = Array.isArray(data.transacciones) ? data.transacciones : [];
                      const nombreArchivo = exportarAExcel(
                        todas,
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
                  sx={{ borderRadius: 2, textTransform: 'none' }}
                >
                  Exportar
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => {
                    resetNuevaTransaccion();
                    setState(prev => ({ ...prev, modalOpen: true, editingTransaction: null }));
                  }}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                >
                  Nuevo Movimiento
                </Button>
              </Box>
            </Box>

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={32} />
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
                  serverFiltered
                />
                {state.pagination.totalPages > 1 && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Pagination
                      count={state.pagination.totalPages}
                      page={state.pagination.page}
                      onChange={handlePageChange}
                      color="primary"
                      showFirstButton
                      showLastButton
                      size="medium"
                      sx={{
                        '& .MuiPaginationItem-root': { borderRadius: 1.5 },
                        '& .Mui-selected': { fontWeight: 700 }
                      }}
                    />
                  </Box>
                )}
              </>
            )}
          </Paper>
        </Grid>
      </Grid>
      </Paper>

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