import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, InputAdornment, IconButton, Chip,
  Alert, CircularProgress, Divider, Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Money as MoneyIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  FileCopy as FileCopyIcon,
  Receipt as ReceiptIcon,
  FilterAlt as FilterAltIcon,
  Close as CloseIcon,
  Dashboard
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';
import TasaCambio from '../TasaCambio';

// URL de la API
const API_URL = "https://suministros-backend.vercel.app/api";

// Variantes de animación para Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

// Componentes estilizados mejorados
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
  transition: 'all 0.2s ease',
  // Cambiar el color si la factura está pagada
  '&.pagada': {
    backgroundColor: theme.palette.success.light,
    '&:hover': {
      backgroundColor: theme.palette.success.light,
      filter: 'brightness(1.05)',
    }
  }
}));

// Contenedor con estilo para el filtrado
const FilterContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  background: 'linear-gradient(120deg, #fafafa 0%, #ffffff 100%)'
}));

// Contenedor principal estilizado
const MainContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const FacturasPendientes = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  // Estados para manejar datos y UI
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para modal de abono
  const [openAbonoModal, setOpenAbonoModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [monedaAbono, setMonedaAbono] = useState('Bs');
  const [errorAbono, setErrorAbono] = useState('');
  
  // Estados para modal de nueva factura
  const [openNuevaFacturaModal, setOpenNuevaFacturaModal] = useState(false);
  const [nuevaFactura, setNuevaFactura] = useState({
    concepto: '',
    proveedor: '',
    numeroFactura: '',
    monto: '',
    moneda: 'Bs',
    fecha: new Date().toISOString().split('T')[0]
  });
  
  // Estados para tasa de cambio
  const [tasaCambio, setTasaCambio] = useState(156.37); // Tasa por defecto
  
  // Función para formatear fecha de manera simple
  const formatearFechaSimple = (fechaString) => {
    if (!fechaString) return 'No disponible';
    try {
      // Forzar a UTC y mostrar solo la fecha
      const fecha = moment.utc(fechaString);
      if (!fecha.isValid()) return 'Fecha inválida';
      return fecha.format('DD/MM/YYYY');
    } catch (error) {
      return 'Error de formato';
    }
  };
  
  // Función para verificar si una factura está pagada
  const esFacturaPagada = (saldo) => {
    return Math.abs(saldo) < 0.0001; // Considerar pagada si el saldo es menor a 0.0001
  };
  
  // Función para redondear a 2 decimales
  const redondear = (valor) => {
    return Math.round(valor * 100) / 100;
  };
  
  // Función para formatear moneda
  const formatearMoneda = (valor, moneda = 'Bs', monedaAbono = 'Bs', monedaOriginal = 'Bs', tasaCambioUsada = null) => {
    // Si el valor es muy pequeño, considerarlo como cero
    if (Math.abs(valor) < 0.01) {
      valor = 0;
    }

    const valorRedondeado = redondear(valor);
    const formateado = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valorRedondeado);

    // Usar la tasa de cambio guardada en la factura si está disponible, sino usar la actual
    const tasaAUsar = tasaCambioUsada || tasaCambio;

    // Debug: mostrar información para troubleshooting
    console.log('formatearMoneda debug:', {
      valor: valorRedondeado,
      moneda,
      monedaOriginal,
      tasaCambioUsada,
      tasaCambio,
      tasaAUsar
    });

    // Si no hay tasa de cambio válida, no mostrar equivalencia
    if (!tasaAUsar || tasaAUsar <= 0) {
      return formateado;
    }

    // Mostrar equivalencia si la moneda original era USD
    if (monedaOriginal === 'USD') {
      const equivalenteUSD = redondear(valorRedondeado / tasaAUsar);
      return `${formateado} (Orig: $ ${equivalenteUSD.toFixed(2)})`;
    }
    
    // Mostrar equivalencia en USD si la moneda es Bs
    if (moneda === 'Bs') {
      const equivalenteUSD = redondear(valorRedondeado / tasaAUsar);
      return `${formateado} (Ref: $ ${equivalenteUSD.toFixed(2)})`;
    }
    return formateado;
  };
  
  // Función para formatear abono con moneda
  const formatearAbono = (valor, monedaAbono) => {
    if (Math.abs(valor) < 0.01) return 'Bs 0.00';
    const valorRedondeado = redondear(valor);
    const formateado = new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valorRedondeado);

    return monedaAbono === 'USD' 
      ? `$ ${(valorRedondeado / tasaCambio).toFixed(2)}`
      : formateado;
  };
  
  // Cargar facturas pendientes
  const cargarFacturas = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        estado: filtroEstado,
        busqueda
      });
      
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);
      
      const response = await axios.get(`${API_URL}/facturaPendiente?${params.toString()}`);
      
      setFacturas(response.data.facturas);
    } catch (error) {
      console.error('Error al cargar facturas pendientes:', error);
      toast.error('No se pudieron cargar las facturas pendientes');
    } finally {
      setLoading(false);
    }
  }, [filtroEstado, busqueda, fechaDesde, fechaHasta]);
  
  // Cargar facturas cuando cambien los filtros
  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);
  
  // Función para buscar facturas (con debounce)
  const buscarFacturas = debounce((valor) => {
    setBusqueda(valor);
  }, 500);
  
  // Manejador de cambio en búsqueda
  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    buscarFacturas(valor);
  };
  
  // Manejador de cambio en filtro de estado
  const handleFiltroEstadoChange = (e) => {
    setFiltroEstado(e.target.value);
  };
  
  // Manejador de cambio en fecha desde
  const handleFechaDesdeChange = (e) => {
    setFechaDesde(e.target.value);
  };
  
  // Manejador de cambio en fecha hasta
  const handleFechaHastaChange = (e) => {
    setFechaHasta(e.target.value);
  };
  
  // Función para convertir monto según moneda
  const convertirMonto = (monto, monedaOrigen, monedaDestino) => {
    if (!monto || !tasaCambio) return 0;
    
    // Convertir entrada a número
    const montoNumerico = typeof monto === 'string' 
      ? parseFloat(monto.replace(',', '.')) 
      : monto;
    
    if (monedaOrigen === monedaDestino) return montoNumerico;
    
    return monedaOrigen === 'USD' 
      ? montoNumerico * tasaCambio
      : montoNumerico / tasaCambio;
  };
  
  // Registrar abono
  const handleRegistrarAbono = async () => {
    // Reemplazar comas por puntos para formato numérico
    const montoNumerico = parseFloat(montoAbono.replace(',', '.'));
    
    // Validación mejorada
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      setErrorAbono('Ingrese un monto válido');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/facturaPendiente/${facturaSeleccionada._id}/abonos`, {
        monto: montoNumerico,
        moneda: monedaAbono,
        tasaCambio: tasaCambio
      });

      toast.success(`Abono de ${monedaAbono} ${montoNumerico.toFixed(2)} registrado correctamente`);
      setOpenAbonoModal(false);
      cargarFacturas();
    } catch (error) {
      console.error('Error al registrar abono:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Error al registrar el abono');
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Modificar el botón de 100%
 
  const handleAbono100 = () => {
    const saldoEnBs = redondear(facturaSeleccionada.saldo);
    const tasaAUsar = facturaSeleccionada.tasaCambioUsada || tasaCambio;
    
    if (monedaAbono === 'Bs') {
      setMontoAbono(saldoEnBs.toFixed(2));
    } else {
      // Calcular el monto exacto en USD necesario para cubrir el saldo en Bs
      const montoUSD = saldoEnBs / tasaAUsar;
      // Redondear hacia arriba para evitar decimales faltantes
      const montoUSDRedondeado = Math.ceil(montoUSD * 100) / 100;
      setMontoAbono(montoUSDRedondeado.toFixed(2));
    }
  };
  
  // Abrir modal de nueva factura
  const abrirModalNuevaFactura = () => {
    setNuevaFactura({
      concepto: '',
      proveedor: '',
      numeroFactura: '',
      monto: '',
      moneda: 'Bs',
      fecha: new Date().toISOString().split('T')[0]
    });
    setOpenNuevaFacturaModal(true);
  };
  
  // Manejador de cambio en campos de nueva factura
  const handleNuevaFacturaChange = (e) => {
    const { name, value } = e.target;
    setNuevaFactura(prev => ({ ...prev, [name]: value }));
  };
  
  // Crear nueva factura
  const handleCrearFactura = async () => {
    if (!nuevaFactura.concepto.trim()) {
      toast.error('El concepto es obligatorio');
      return;
    }
    
    if (!nuevaFactura.monto || isNaN(nuevaFactura.monto) || parseFloat(nuevaFactura.monto) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(API_URL + '/facturaPendiente', {
        ...nuevaFactura,
        tasaCambio: tasaCambio
      });
      
      toast.success('Factura registrada correctamente');
      setOpenNuevaFacturaModal(false);
      cargarFacturas();
    } catch (error) {
      console.error('Error al crear factura:', error);
      toast.error('Error al registrar la factura');
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar factura
  const handleEliminarFactura = async (facturaId) => {
    if (!window.confirm('¿Está seguro de eliminar esta factura?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/facturaPendiente/${facturaId}`);
      
      toast.success('Factura eliminada correctamente');
      cargarFacturas();
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      toast.error('Error al eliminar la factura');
    } finally {
      setLoading(false);
    }
  };
  
  // Agregar useEffect para obtener la tasa de cambio inicial
  useEffect(() => {
    const obtenerTasaCambio = async () => {
      try {
        console.log('Obteniendo tasa de cambio desde:', `${API_URL}/tasa-cambio`);
        const response = await axios.get(`${API_URL}/tasa-cambio`);
        console.log('Respuesta de tasa de cambio:', response.data);
        setTasaCambio(response.data.tasa);
        console.log('Tasa de cambio establecida:', response.data.tasa);
      } catch (error) {
        console.error('Error al obtener la tasa de cambio:', error);
        console.error('Detalles del error:', error.response?.data);
        toast.error('Error al obtener la tasa de cambio');
      }
    };

    obtenerTasaCambio();
  }, []);

  // Función para manejar cambios en la tasa de cambio
  const handleTasaChange = (nuevaTasa) => {
    setTasaCambio(nuevaTasa);
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <MainContainer maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Dashboard />}
            onClick={() => navigate('/dashboard')}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 5px rgba(33, 150, 243, .2)'
            }}
          >
            Ir al Dashboard
          </Button>
        </Box>
        
        <ToastContainer 
          position="top-right" 
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
        
        <motion.div variants={itemVariants}>
          <Typography 
            variant="h4" 
            component={motion.h4}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            sx={{ 
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold',
              mb: 4
            }}
          >
            Facturas Pendientes
          </Typography>
        </motion.div>
        
        {/* Agregar el componente TasaCambio después del título */}
        <Box sx={{ mb: 4 }}>
          <TasaCambio onTasaChange={handleTasaChange} />
        </Box>
        
        {/* Filtros */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.3 }}
        >
          <FilterContainer elevation={2}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2
            }}>
              <Typography 
                variant="h6" 
                color="primary"
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <FilterAltIcon /> Filtros
              </Typography>
              <Button
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={() => {
                  setBusqueda('');
                  setFiltroEstado('todas');
                  setFechaDesde('');
                  setFechaHasta('');
                }}
                sx={{ textTransform: 'none' }}
              >
                Reiniciar filtros
              </Button>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Buscar"
                  variant="outlined"
                  size="small"
                  onChange={handleBusquedaChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                    sx: { borderRadius: '10px' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  select
                  label="Estado"
                  value={filtroEstado}
                  onChange={handleFiltroEstadoChange}
                  variant="outlined"
                  size="small"
                  InputProps={{
                    sx: { borderRadius: '10px' }
                  }}
                >
                  <MenuItem value="pendientes">Pendientes</MenuItem>
                  <MenuItem value="parciales">Abonadas</MenuItem>
                  <MenuItem value="pagadas">Pagadas</MenuItem>
                  <MenuItem value="todas">Todas</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Desde"
                  type="date"
                  value={fechaDesde}
                  onChange={handleFechaDesdeChange}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: { borderRadius: '10px' },
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="Hasta"
                  type="date"
                  value={fechaHasta}
                  onChange={handleFechaHastaChange}
                  variant="outlined"
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    sx: { borderRadius: '10px' },
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarIcon color="primary" fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </FilterContainer>
        </motion.div>
        
        {/* Botón Nueva Factura */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            mb: 3
          }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={abrirModalNuevaFactura}
                sx={{
                  borderRadius: '12px',
                  padding: '12px 24px',
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  fontSize: '1rem'
                }}
              >
                Nueva Factura
              </Button>
            </motion.div>
          </Box>
        </motion.div>
        
        {/* Tabla de facturas */}
        <motion.div
          variants={itemVariants}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Paper sx={{ 
            borderRadius: '16px', 
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>
                      Fecha
                      <Box component="span" sx={{ ml: 1, color: 'primary.main' }}>
                        ↓
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell>Concepto</StyledTableCell>
                    <StyledTableCell>Proveedor</StyledTableCell>
                    <StyledTableCell>N° Factura</StyledTableCell>
                    <StyledTableCell align="center">Moneda</StyledTableCell>
                    <StyledTableCell align="right">Monto (Bs)</StyledTableCell>
                    <StyledTableCell align="right">Abonado (Bs)</StyledTableCell>
                    <StyledTableCell align="right">Saldo (Bs)</StyledTableCell>
                    <StyledTableCell align="center">Acciones</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {loading && facturas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <CircularProgress size={50} thickness={4} />
                            </motion.div>
                            <Typography sx={{ mt: 2 }}>Cargando facturas...</Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : facturas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 5 }}>
                          <Alert 
                            severity="info" 
                            icon={<ReceiptIcon fontSize="inherit" />}
                            sx={{ 
                              maxWidth: '600px', 
                              mx: 'auto',
                              borderRadius: '10px',
                              '& .MuiAlert-icon': {
                                fontSize: '2rem',
                                alignItems: 'center'
                              }
                            }}
                          >
                            <Typography variant="h6" sx={{ mb: 1 }}>No hay facturas</Typography>
                            No hay facturas que coincidan con los filtros aplicados
                          </Alert>
                        </TableCell>
                      </TableRow>
                    ) : (
                      facturas.map((factura, index) => (
                        <motion.tr
                          key={factura._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                          component={StyledTableRow}
                          className={esFacturaPagada(factura.saldo) ? 'pagada' : ''}
                          layout
                        >
                          <TableCell>{formatearFechaSimple(factura.fecha)}</TableCell>
                          <TableCell>
                            <Tooltip title={factura.concepto} arrow>
                              <Typography 
                                sx={{ 
                                  maxWidth: '200px', 
                                  overflow: 'hidden', 
                                  textOverflow: 'ellipsis', 
                                  whiteSpace: 'nowrap',
                                  fontWeight: esFacturaPagada(factura.saldo) ? 'normal' : 'medium'
                                }}
                              >
                                {factura.concepto}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{factura.proveedor || '-'}</TableCell>
                          <TableCell>{factura.numeroFactura || '-'}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={factura.moneda || 'Bs'} 
                              color={factura.moneda === 'USD' ? 'primary' : 'secondary'} 
                              variant="outlined" 
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{formatearMoneda(factura.monto, 'Bs', 'Bs', factura.moneda, factura.tasaCambioUsada)}</TableCell>
                          <TableCell align="right">
                            <Box>
                              {formatearAbono(factura.abono, factura.monedaAbono || 'Bs')}
                              <Typography variant="caption" color="textSecondary" display="block">
                                ({factura.monedaAbono || 'Bs'})
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <motion.div whileHover={{ scale: 1.05 }}>
                              <Chip 
                                label={formatearMoneda(factura.saldo, 'Bs', 'Bs', factura.moneda, factura.tasaCambioUsada)}
                                color={esFacturaPagada(factura.saldo) ? 'success' : factura.abono > 0 ? 'warning' : 'error'}
                                variant={esFacturaPagada(factura.saldo) ? 'filled' : 'outlined'}
                                sx={{ 
                                  fontWeight: 'bold',
                                  boxShadow: esFacturaPagada(factura.saldo) ? '0 2px 5px rgba(76, 175, 80, 0.4)' : 'none'
                                }}
                              />
                            </motion.div>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              {factura.saldo > 0 && (
                                <Tooltip title="Registrar abono" arrow>
                                  <motion.div
                                    whileHover={{ scale: 1.15 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <IconButton 
                                      color="primary"
                                      onClick={() => {
                                        setFacturaSeleccionada(factura);
                                        setMontoAbono('');
                                        setMonedaAbono('Bs');
                                        setErrorAbono('');
                                        setOpenAbonoModal(true);
                                      }}
                                      size="small"
                                      sx={{ 
                                        boxShadow: '0 2px 5px rgba(33, 150, 243, 0.3)',
                                        backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                        '&:hover': {
                                          backgroundColor: 'rgba(33, 150, 243, 0.2)',
                                        }
                                      }}
                                    >
                                      <MoneyIcon />
                                    </IconButton>
                                  </motion.div>
                                </Tooltip>
                              )}
                              <Tooltip title="Eliminar" arrow>
                                <motion.div
                                  whileHover={{ scale: 1.15 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <IconButton 
                                    color="error"
                                    onClick={() => handleEliminarFactura(factura._id)}
                                    size="small"
                                    sx={{ 
                                      boxShadow: '0 2px 5px rgba(244, 67, 54, 0.3)',
                                      backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                      '&:hover': {
                                        backgroundColor: 'rgba(244, 67, 54, 0.2)',
                                      }
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </motion.div>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>
            
          </Paper>
        </motion.div>
        
        {/* Modal de Abono */}
        <AnimatePresence>
          {openAbonoModal && facturaSeleccionada && (
            <Dialog 
              open={openAbonoModal} 
              onClose={() => setOpenAbonoModal(false)}
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
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 2,
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>
                Registrar Abono a Factura
                <IconButton 
                  size="small" 
                  onClick={() => setOpenAbonoModal(false)}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ 
                pt: 3, 
                px: 3, 
                pb: 2,
                bgcolor: '#ffffff' // Fondo blanco explícito
              }}>
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Detalles de la Factura
                  </Typography>
                  
                  <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8f9fa', borderRadius: '10px', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>Concepto:</Typography>
                        <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium', color: 'text.primary' }}>
                          {facturaSeleccionada.concepto}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Fecha:</Typography>
                        <Typography variant="body1" gutterBottom>
                          {formatearFechaSimple(facturaSeleccionada.fecha)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Monto Total:</Typography>
                        <Typography variant="body1" gutterBottom fontWeight="medium">
                          {formatearMoneda(facturaSeleccionada.monto, 'Bs', 'Bs', facturaSeleccionada.moneda, facturaSeleccionada.tasaCambioUsada)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Total Abonado:</Typography>
                        <Typography variant="body1" gutterBottom color="success.main">
                          {formatearAbono(facturaSeleccionada.abono, facturaSeleccionada.monedaAbono || 'Bs')}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Saldo Pendiente:</Typography>
                        <Typography variant="body1" gutterBottom color="error.main" fontWeight="bold">
                          {formatearMoneda(facturaSeleccionada.saldo, 'Bs', 'Bs', facturaSeleccionada.moneda, facturaSeleccionada.tasaCambioUsada)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                  
                  <Grid container spacing={2} sx={{ mt: 3, bgcolor: '#ffffff' }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Monto a Abonar"
                        type="number"
                        value={montoAbono}
                        onChange={(e) => setMontoAbono(e.target.value)}
                        error={!!errorAbono}
                        helperText={errorAbono}
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {monedaAbono === 'Bs' ? 'Bs.' : '$'}
                            </InputAdornment>
                          ),
                          sx: { 
                            borderRadius: '10px',
                            bgcolor: '#ffffff'
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        select
                        label="Moneda"
                        value={monedaAbono}
                        onChange={(e) => setMonedaAbono(e.target.value)}
                        variant="outlined"
                        InputProps={{
                          sx: { 
                            borderRadius: '10px',
                            bgcolor: '#ffffff'
                          }
                        }}
                      >
                        <MenuItem value="Bs">Bolívares (Bs)</MenuItem>
                        <MenuItem value="USD">Dólares ($)</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>

                  {montoAbono && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: '10px' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Equivalente en {monedaAbono === 'Bs' ? 'Dólares' : 'Bolívares'}:
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        {monedaAbono === 'Bs' 
                          ? `$ ${(parseFloat(montoAbono.replace(',', '.')) / tasaCambio).toFixed(2)}`
                          : `Bs. ${(parseFloat(montoAbono.replace(',', '.')) * tasaCambio).toFixed(2)}`
                        }
                      </Typography>
                    </Box>
                  )}
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, gap: 2, bgcolor: '#ffffff' }}>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => {
                          const monto50 = facturaSeleccionada.saldo / 2;
                          const tasaAUsar = facturaSeleccionada.tasaCambioUsada || tasaCambio;
                          setMontoAbono(monedaAbono === 'Bs' ? monto50.toFixed(2) : (monto50 / tasaAUsar).toFixed(2));
                        }}
                        sx={{ 
                          borderRadius: '10px', 
                          py: 1,
                          bgcolor: '#ffffff'
                        }}
                      >
                        50% ({monedaAbono === 'Bs' 
                          ? formatearMoneda(facturaSeleccionada.saldo / 2, 'Bs', 'Bs', facturaSeleccionada.moneda, facturaSeleccionada.tasaCambioUsada)
                          : `$ ${(facturaSeleccionada.saldo / (2 * (facturaSeleccionada.tasaCambioUsada || tasaCambio))).toFixed(2)}`
                        })
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} style={{ flex: 1 }}>
                      <Button
                        variant="outlined"
                        color="success"
                        fullWidth
                        onClick={handleAbono100}
                        sx={{ 
                          borderRadius: '10px', 
                          py: 1,
                          bgcolor: '#ffffff'
                        }}
                      >
                        100% ({monedaAbono === 'Bs'
                          ? formatearMoneda(facturaSeleccionada.saldo, 'Bs', 'Bs', facturaSeleccionada.moneda, facturaSeleccionada.tasaCambioUsada)
                          : `$ ${(facturaSeleccionada.saldo / (facturaSeleccionada.tasaCambioUsada || tasaCambio)).toFixed(2)}`
                        })
                      </Button>
                    </motion.div>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions sx={{ 
                px: 3, 
                pb: 3, 
                pt: 2,
                justifyContent: 'space-between',
                bgcolor: '#ffffff' // Fondo blanco explícito
              }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => setOpenAbonoModal(false)}
                    variant="outlined"
                    sx={{ 
                      borderRadius: '10px',
                      px: 3,
                      textTransform: 'none'
                    }}
                  >
                    Cancelar
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleRegistrarAbono}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <MoneyIcon />}
                    sx={{ 
                      borderRadius: '10px',
                      px: 3,
                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Registrando...' : 'Registrar Abono'}
                  </Button>
                </motion.div>
              </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>
        
        {/* Modal de Nueva Factura */}
        <AnimatePresence>
          {openNuevaFacturaModal && (
            <Dialog 
              open={openNuevaFacturaModal} 
              onClose={() => setOpenNuevaFacturaModal(false)}
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
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '1.25rem'
              }}>
                Registrar Nueva Factura Pendiente
                <IconButton 
                  size="small" 
                  onClick={() => setOpenNuevaFacturaModal(false)}
                  sx={{ color: 'white' }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent sx={{ 
                pt: 3, 
                p: 3,
                bgcolor: '#ffffff', // Fondo blanco explícito
                position: 'relative',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: '#ffffff',
                  zIndex: -1
                }
              }}>
                <Box component={motion.div} layout>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Concepto"
                        name="concepto"
                        value={nuevaFactura.concepto}
                        onChange={handleNuevaFacturaChange}
                        required
                        variant="outlined"
                        InputProps={{
                          sx: { 
                            borderRadius: '10px',
                            bgcolor: '#ffffff'  // Asegura visibilidad
                          }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Proveedor"
                        name="proveedor"
                        value={nuevaFactura.proveedor}
                        onChange={handleNuevaFacturaChange}
                        variant="outlined"
                        InputProps={{
                          sx: { borderRadius: '10px' }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Número de Factura"
                        name="numeroFactura"
                        value={nuevaFactura.numeroFactura}
                        onChange={handleNuevaFacturaChange}
                        variant="outlined"
                        InputProps={{
                          startAdornment: <ReceiptIcon color="primary" sx={{ mr: 1, opacity: 0.6 }} />,
                          sx: { borderRadius: '10px' }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Fecha"
                        type="date"
                        name="fecha"
                        value={nuevaFactura.fecha}
                        onChange={handleNuevaFacturaChange}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        InputProps={{
                          startAdornment: <CalendarIcon color="primary" sx={{ mr: 1, opacity: 0.6 }} />,
                          sx: { borderRadius: '10px' }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Moneda"
                        name="moneda"
                        select
                        value={nuevaFactura.moneda}
                        onChange={handleNuevaFacturaChange}
                        variant="outlined"
                        InputProps={{
                          sx: { borderRadius: '10px' }
                        }}
                      >
                        <MenuItem value="Bs">Bolívares (Bs)</MenuItem>
                        <MenuItem value="USD">Dólares ($)</MenuItem>
                      </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Monto"
                        name="monto"
                        type="number"
                        value={nuevaFactura.monto}
                        onChange={handleNuevaFacturaChange}
                        required
                        variant="outlined"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <MoneyIcon color="primary" sx={{ mr: 0.5 }} />
                              {nuevaFactura.moneda === 'USD' ? '$' : 'Bs.'}
                            </InputAdornment>
                          ),
                          sx: { borderRadius: '10px' }
                        }}
                      />
                    </Grid>
                  </Grid>
                  
                  {/* Mostrar equivalencia si hay monto y tasa de cambio */}
                  {nuevaFactura.monto && tasaCambio > 0 && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: '10px' }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Equivalencia:
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                        {nuevaFactura.moneda === 'Bs' 
                          ? `$ ${(parseFloat(nuevaFactura.monto) / tasaCambio).toFixed(2)}`
                          : `Bs. ${(parseFloat(nuevaFactura.monto) * tasaCambio).toFixed(2)}`
                        }
                      </Typography>
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <DialogActions sx={{ 
                px: 3, 
                pb: 3, 
                justifyContent: 'space-between',
                bgcolor: '#ffffff' // Fondo blanco explícito
              }}>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    onClick={() => setOpenNuevaFacturaModal(false)}
                    variant="outlined"
                    sx={{ 
                      borderRadius: '10px',
                      px: 3,
                      textTransform: 'none'
                    }}
                  >
                    Cancelar
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button 
                    variant="contained" 
                    onClick={handleCrearFactura}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                    sx={{ 
                      borderRadius: '10px',
                      px: 3,
                      background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                      textTransform: 'none',
                      fontWeight: 'bold'
                    }}
                  >
                    {loading ? 'Registrando...' : 'Registrar Factura'}
                  </Button>
                </motion.div>
              </DialogActions>
            </Dialog>
          )}
        </AnimatePresence>
      </MainContainer>
    </motion.div>
  );
};

// Función para mostrar el estado como chip
const EstadoChip = ({ pagada, saldo }) => {
  if (pagada) {
    return (
      <Chip 
        label="Pagada" 
        color="success"
        size="small"
        variant="filled"
        sx={{ 
          fontWeight: 'bold',
          boxShadow: '0 2px 5px rgba(0,200,83,0.2)',
          '& .MuiChip-label': { px: 2 }
        }}
      />
    );
  }
  
  return (
    <Chip 
      label="Pendiente" 
      color="warning"
      size="small"
      variant="filled"
      sx={{ 
        fontWeight: 'bold',
        boxShadow: '0 2px 5px rgba(255,152,0,0.2)',
        '& .MuiChip-label': { px: 2 }
      }}
    />
  );
};

export default FacturasPendientes;