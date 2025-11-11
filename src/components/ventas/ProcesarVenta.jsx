import React, { useState, useEffect} from 'react';
import { 
  Container, Typography, Grid, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, 
  Select, MenuItem, Box, Chip, Tabs, Tab, InputAdornment, Alert, Snackbar, Drawer, IconButton,
  CircularProgress, Tooltip, useTheme, useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
  VpnKey, Dashboard, PriceChange as PriceChangeIcon, Close as CloseIcon, Visibility as VisibilityIcon,
  Add as AddIcon, ShoppingCart as ShoppingCartIcon, Person as PersonIcon, Inventory as InventoryIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmarPagoModal from './ConfirmarPagoModal';
import moment from 'moment';
import axios from 'axios';
import ListadoHistorialVentas from './ListadoHistorialVentas';
import { useNavigate } from 'react-router-dom';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

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
  transition: 'all 0.2s ease',
}));

const FilterContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  background: 'linear-gradient(120deg, #fafafa 0%, #ffffff 100%)'
}));

const MainContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '12px 24px',
  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
  textTransform: 'none',
  fontWeight: 'bold',
  fontSize: '1rem',
  '&:hover': {
    background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
    boxShadow: '0 5px 8px 2px rgba(33, 150, 243, .4)',
    transform: 'translateY(-2px)',
  },
  transition: 'all 0.3s ease',
}));

// Variantes de animación
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
  visible: { opacity: 1, y: 0 }
};

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const ProcesarVenta = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [state, setState] = useState({
    busquedaDni: '',
    cliente: null,
    productosVenta: [],
    productos: [],
    clientes: [],
    clientesFiltrados: [],
    mostrarModalPago: false,
    metodoPago: 'efectivo',
    tipoPago: 'contado',
    nrFactura: '',
    banco: '',
    montoAbonar: '',
    showPrecios: false,
    pinDialog: false,
    pinInput: '',
    productoSeleccionado: null,
    cantidadInput: '',
    precioVentaInput: '',
    fechaVenta: new Date().toISOString().split('T')[0],
    error: null
  });

  

  const [tabValue, setTabValue] = useState(0);
  const [errorFecha, setErrorFecha] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const navigate = useNavigate();

  const [lotesProducto, setLotesProducto] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  // Estados para el Drawer de precios
  const [openPreciosDrawer, setOpenPreciosDrawer] = useState(false);
  const [listasPrecios, setListasPrecios] = useState([]);
  const [loadingPrecios, setLoadingPrecios] = useState(false);
  const [tasaCambio, setTasaCambio] = useState(156.37);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    cargarDatosIniciales();
    obtenerTasaCambio();
  }, []);

  // Función para obtener la tasa de cambio
  const obtenerTasaCambio = async () => {
    try {
      const response = await axios.get(`${API_URL}/tasa-cambio`);
      setTasaCambio(response.data.tasa);
    } catch (error) {
      console.error('Error al obtener la tasa de cambio:', error);
    }
  };

  // Función para cargar listas de precios
  const cargarListasPrecios = async () => {
    setLoadingPrecios(true);
    try {
      const response = await axios.get(`${API_URL}/listaprecios?limit=1000`);
      setListasPrecios(response.data.listasPrecios || []);
    } catch (error) {
      console.error('Error al cargar listas de precios:', error);
      toast.error('Error al cargar las listas de precios');
    } finally {
      setLoadingPrecios(false);
    }
  };

  // Función para abrir el drawer de precios
  const handleAbrirPrecios = () => {
    setOpenPreciosDrawer(true);
    cargarListasPrecios();
  };

  // Función para redondear a 2 decimales
  const redondear = (valor) => {
    return Math.round(valor * 100) / 100;
  };

  // Función para formatear moneda con equivalencias (precios en USD con equivalencia en Bs)
  const formatearMoneda = (valor, moneda = 'USD', monedaAbono = 'Bs', monedaOriginal = 'USD', tasaCambioUsada = null) => {
    // Si el valor es muy pequeño, considerarlo como cero
    if (Math.abs(valor) < 0.01) {
      valor = 0;
    }

    const valorRedondeado = redondear(valor);
    
    // Los precios están en USD, así que formateamos en USD
    const formateado = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(valorRedondeado);

    // Usar la tasa de cambio guardada si está disponible y es válida, sino usar la actual
    const tasaAUsar = (tasaCambioUsada && tasaCambioUsada > 1) ? tasaCambioUsada : tasaCambio;

    // Si no hay tasa de cambio válida, no mostrar equivalencia
    if (!tasaAUsar || tasaAUsar <= 0) {
      return formateado;
    }

    // Mostrar equivalencia en Bs si la moneda es USD
    if (moneda === 'USD') {
      const equivalenteBs = redondear(valorRedondeado * tasaAUsar);
      const formateadoBs = new Intl.NumberFormat('es-VE', {
        style: 'currency',
        currency: 'VES',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(equivalenteBs);
      return `${formateado} (Ref: ${formateadoBs})`;
    }
    
    return formateado;
  };

  const cargarDatosIniciales = async () => {
    try {
      const [productosRes, clientesRes] = await Promise.all([
        axios.get(`${API_URL}/productos`),
        axios.get(`${API_URL}/clientes?limit=1000`)
      ]);
      
      setState(prev => ({
        ...prev,
        productos: productosRes.data?.productos || [],
        clientes: clientesRes.data?.clientes || [],
        clientesFiltrados: clientesRes.data?.clientes || []
      }));
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast.error('Error al cargar los datos iniciales');
    }
  };

  const filtrarClientes = () => {
    const term = state.busquedaDni.toLowerCase();
    const filtrados = state.clientes.filter(c => 
      c.rif?.toLowerCase().includes(term) || 
      c.nombre?.toLowerCase().includes(term)
    );
    setState(prev => ({ ...prev, clientesFiltrados: filtrados }));
  };


  const totalGeneral = state.productosVenta.reduce((total, producto) => {
    return total + (producto.precioVenta * producto.cantidad);
  }, 0);

  const handlePinSubmit = async () => {
    try {
      // Petición al backend para obtener la clave actual (nombre de ruta corregido)
      const response = await axios.get(`${API_URL}/unlock-key`);
      const claveActual = response.data.key;

      if (state.pinInput === claveActual) {
        setState(prev => ({
          ...prev,
          showPrecios: true,
          pinDialog: false,
          pinInput: ''
        }));
        toast.success('Campos desbloqueados');
      } else {
        toast.error('Clave incorrecta');
        setState(prev => ({ ...prev, pinInput: '' }));
      }
    } catch (error) {
      toast.error('Error al verificar la clave');
      setState(prev => ({ ...prev, pinInput: '' }));
    }
  };

  const handleSeleccionarProducto = async (producto) => {
    setLoadingLotes(true);
    try {
      const res = await axios.get(`${API_URL}/productos/${producto._id}/lotes`);
      let lotes = res.data.lotes || []; // Acceder a la propiedad lotes de la respuesta
      
      // Asegurarnos de que lotes sea un array
      if (!Array.isArray(lotes)) {
        lotes = [lotes].filter(Boolean); // Convertir a array si es un solo objeto
      }
      
      // Filtrar solo los lotes que tienen stock disponible
      lotes = lotes.filter(lote => lote && lote.stockLote > 0);
      
      if (lotes.length === 0) {
        toast.error('No hay lotes disponibles para este producto');
        setLotesProducto([]);
        return;
      }

      setLotesProducto(lotes);
      setState(prev => ({
        ...prev,
        productoSeleccionado: producto,
        cantidadInput: '',
        precioVentaInput: ''
      }));
    } catch (err) {
      console.error('Error al cargar lotes:', err);
      toast.error('Error al cargar lotes del producto');
      setLotesProducto([]);
    } finally {
      setLoadingLotes(false);
    }
  };

  const agregarProducto = async () => {
    if (!state.cantidadInput || state.cantidadInput < 1) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    if (lotesProducto.length === 0) {
      toast.error('No hay lotes disponibles');
      return;
    }

    const cantidad = parseInt(state.cantidadInput);
    let cantidadRestante = cantidad;
    let productosPorLote = [];
    let precioVenta = parseFloat(state.precioVentaInput);

    // Verificar si hay suficiente stock total
    const stockTotal = lotesProducto.reduce((total, lote) => total + lote.stockLote, 0);
    if (stockTotal < cantidad) {
      toast.error(`Solo hay ${stockTotal} unidades disponibles`);
      return;
    }

    for (const lote of lotesProducto) {
      if (cantidadRestante <= 0) break;
      const cantidadDeEsteLote = Math.min(lote.stockLote, cantidadRestante);
      
      if (cantidadDeEsteLote > 0) {
        productosPorLote.push({
          ...state.productoSeleccionado,
          cantidad: cantidadDeEsteLote,
          precioVenta: precioVenta,
          costoFinal: lote.costoFinal,
          gananciaUnitaria: parseFloat((precioVenta - lote.costoFinal).toFixed(2)),
          gananciaTotal: parseFloat(((precioVenta - lote.costoFinal) * cantidadDeEsteLote).toFixed(2)),
          loteId: lote._id
        });
        cantidadRestante -= cantidadDeEsteLote;
      }
    }

    if (cantidadRestante > 0) {
      toast.error('No hay suficiente stock en los lotes');
      return;
    }

    setState(prev => ({
      ...prev,
      productosVenta: [...prev.productosVenta, ...productosPorLote],
      productoSeleccionado: null,
      cantidadInput: '',
      precioVentaInput: ''
    }));
    setLotesProducto([]);
  };

  const finalizarVenta = async (formState) => {
    try {
      // Asegurar que solo se envíe el ID del cliente
      const clienteId = state.cliente?.id;

      if (!clienteId) {
        throw new Error('ID de cliente inválido');
      }

      // Calcular montos con precisión decimal
      const totalVenta = parseFloat(totalGeneral.toFixed(2));
      const montoAbonadoFinal = formState.tipoPago === 'contado' 
        ? totalVenta 
        : parseFloat(Number(formState.montoAbonar || 0).toFixed(2));
      
      const saldoPendiente = parseFloat((totalVenta - montoAbonadoFinal).toFixed(2));

      // Validar montos
      if (montoAbonadoFinal > totalVenta) {
        throw new Error('El monto abonado no puede ser mayor al total de la venta');
      }

      if (saldoPendiente < 0) {
        throw new Error('El saldo pendiente no puede ser negativo');
      }

      // Validar que los montos coincidan
      if (Math.abs((totalVenta - montoAbonadoFinal - saldoPendiente)) > 0.01) {
        throw new Error('El saldo pendiente no coincide con el total y monto abonado');
      }

      const ventaData = {
        fecha: formState.fechaVenta,
        cliente: clienteId,
        productos: state.productosVenta.map(p => ({
          producto: p._id,
          cantidad: parseFloat(p.cantidad),
          precioUnitario: parseFloat(p.precioVenta.toFixed(2)),
          costoInicial: parseFloat(p.costoFinal.toFixed(2)),
          gananciaUnitaria: parseFloat(p.gananciaUnitaria.toFixed(2)),
          gananciaTotal: parseFloat(p.gananciaTotal.toFixed(2))
        })),
        total: totalVenta,
        tipoPago: formState.tipoPago,
        metodoPago: formState.metodoPago,
        nrFactura: formState.nrFactura,
        banco: formState.metodoPago !== 'efectivo' ? formState.banco : undefined,
        montoAbonado: montoAbonadoFinal,
        saldoPendiente: saldoPendiente
      };

      console.log('Datos de la venta:', ventaData);

      const response = await axios.post(`${API_URL}/ventas`, ventaData);
      console.log('Venta creada:', response.data);

      // Limpiar el estado después de la venta
      setState(prev => ({
        ...prev,
        mostrarModalPago: false,
        productosVenta: [],
        cliente: null,
        busquedaDni: '',
        nrFactura: '',
        montoAbonar: ''
      }));

      // Volver a cargar productos y clientes para actualizar el stock
      await cargarDatosIniciales();

      toast.success('Venta registrada exitosamente!');
      
    } catch (error) {
      console.error('Error al finalizar la venta:', error);
      console.error('Respuesta de error:', error.response?.data);
      toast.error(error.response?.data?.error || error.message || 'Error al finalizar la venta');
    }
  };

  const seleccionarCliente = async (cliente) => {
    try {
      const response = await axios.get(`${API_URL}/ventas`, {
        params: {
          cliente: cliente.id,
          saldoPendiente: true
        }
      });

      const deudasPendientes = response.data.ventas;

      if (deudasPendientes.length > 0) {
        const montoTotalDeuda = deudasPendientes.reduce((total, venta) => total + venta.saldoPendiente, 0);

        setSnackbarMessage(
          `El cliente ${cliente.nombre} tiene ${deudasPendientes.length} deuda(s) pendiente(s) por un total de $${montoTotalDeuda.toFixed(2)}.`
        );
        setOpenSnackbar(true);
      }

      setState((prevState) => ({
        ...prevState,
        cliente,
      }));
    } catch (error) {
      console.error('Error al verificar deudas del cliente:', error);
      toast.error('Error al cargar deudas pendientes');
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleFinalizarVenta = () => {
    if (!state.cliente) {
      toast.error('Debes seleccionar un cliente antes de finalizar la venta.');
      return;
    }

    if (state.productosVenta.length === 0) {
      toast.error('Debes agregar al menos un producto antes de finalizar la venta.');
      return;
    }

    setState(prev => ({ ...prev, mostrarModalPago: true }));
  };

  // Validación de cálculos
  useEffect(() => {
    const totalCalculado = state.productosVenta.reduce((acc, p) => 
      acc + (parseFloat(p.precioVenta) * parseFloat(p.cantidad)), 0);
    
    const diferencia = Math.abs(totalCalculado - totalGeneral);
    if (diferencia > 0.05) {
      setState(prev => ({
        ...prev,
        error: 'Discrepancia en cálculos. Verifique precios y cantidades'
      }));
    } else {
      setState(prev => ({
        ...prev,
        error: null
      }));
    }
  }, [state.productosVenta, totalGeneral]);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <MainContainer maxWidth="xl">
        {/* Botón para ir al Dashboard */}
        <motion.div variants={itemVariants}>
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <StyledButton
                variant="contained"
                color="primary"
                onClick={() => navigate('/dashboard')}
                startIcon={<Dashboard />}
              >
                Ir al Dashboard
              </StyledButton>
            </motion.div>
          </Box>
        </motion.div>

        {/* Título Principal */}
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 4
          }}>
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
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}
            >
              <ShoppingCartIcon sx={{ fontSize: '2rem' }} />
              Procesar Venta
            </Typography>
          </Box>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={itemVariants}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            backgroundColor: '#f8f9fa', 
            mb: 3,
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <Tabs 
              value={tabValue} 
              onChange={handleChangeTab} 
              aria-label="Pestañas de Procesar Venta"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: 'primary.main',
                  height: 3,
                  borderRadius: '2px'
                },
                '& .MuiTab-root': {
                  borderRadius: '8px 8px 0 0',
                  marginRight: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.04)'
                  }
                }
              }}
            >
              <Tab 
                label="Nueva Venta" 
                sx={{ 
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem'
                }} 
              />
              <Tab 
                label="Historial de Ventas" 
                sx={{ 
                  fontWeight: 'bold',
                  textTransform: 'none',
                  fontSize: '1rem'
                }} 
              />
            </Tabs>
          </Paper>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Paper elevation={3} sx={{ 
            p: 3, 
            backgroundColor: '#f8f9fa',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Sección de Clientes */}
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <FilterContainer elevation={2}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    mb: 2
                  }}>
                    <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography 
                      variant="h6" 
                      color="primary"
                      sx={{ fontWeight: 'bold' }}
                    >
                      Selección de Cliente
                    </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Buscar Cliente (RIF o Nombre)"
                        value={state.busquedaDni}
                        onChange={(e) => {
                          setState(prev => ({ ...prev, busquedaDni: e.target.value }));
                          filtrarClientes();
                        }}
                        fullWidth
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '12px',
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                          }
                        }}
                      />
                    </Grid>
                  
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Seleccionar Cliente</InputLabel>
                        <Select
                          value={state.cliente?.id || ''}
                          onChange={(e) => {
                            const clienteSeleccionado = state.clientesFiltrados.find(c => c.id === e.target.value);
                            if (clienteSeleccionado) seleccionarCliente(clienteSeleccionado);
                          }}
                          sx={{
                            borderRadius: '12px',
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: 'primary.main',
                            },
                          }}
                          MenuProps={{
                            PaperProps: {
                              style: {
                                maxHeight: 400,
                                borderRadius: '12px',
                              },
                            },
                            anchorOrigin: {
                              vertical: 'bottom',
                              horizontal: 'left',
                            },
                            transformOrigin: {
                              vertical: 'top',
                              horizontal: 'left',
                            },
                          }}
                        >
                          {state.clientesFiltrados.map(cliente => (
                            <MenuItem 
                              key={cliente.id} 
                              value={cliente.id}
                              sx={{
                                whiteSpace: 'normal',
                                wordBreak: 'break-word',
                                py: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                borderRadius: '8px',
                                margin: '4px',
                                '&:hover': {
                                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                                }
                              }}
                            >
                              <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                {cliente.nombre}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                RIF: {cliente.rif}
                              </Typography>
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </FilterContainer>
              </motion.div>
            </Grid>

            {/* Sección de Productos */}
            <Grid item xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Paper sx={{ 
                  p: 2, 
                  height: 500, 
                  overflow: 'auto',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2,
                    pb: 2,
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <InventoryIcon />
                      Productos Disponibles
                    </Typography>
                    <Tooltip title="Ver precios de referencia" arrow>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant="outlined"
                          startIcon={<PriceChangeIcon />}
                          onClick={handleAbrirPrecios}
                          sx={{
                            borderRadius: '12px',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            borderColor: 'primary.main',
                            color: 'primary.main',
                            px: 3,
                            py: 1,
                            boxShadow: '0 2px 5px rgba(33, 150, 243, 0.2)',
                            '&:hover': {
                              backgroundColor: 'primary.main',
                              color: 'white',
                              boxShadow: '0 4px 8px rgba(33, 150, 243, 0.3)',
                              transform: 'translateY(-2px)'
                            },
                            transition: 'all 0.3s ease'
                          }}
                        >
                          Precios de Referencia
                        </Button>
                      </motion.div>
                    </Tooltip>
                  </Box>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>Producto</StyledTableCell>
                          <StyledTableCell>Código</StyledTableCell>
                          {state.showPrecios && <StyledTableCell>Costo Final</StyledTableCell>}
                          <StyledTableCell>Stock</StyledTableCell>
                          <StyledTableCell>Acciones</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {state.productos.map((producto, index) => (
                            <motion.tr
                              key={producto._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.02 }}
                              component={StyledTableRow}
                              layout
                            >
                              <TableCell>
                                <Typography sx={{ fontWeight: 'medium' }}>
                                  {producto.nombre}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ color: 'text.secondary' }}>
                                  {producto.codigo}
                                </Typography>
                              </TableCell>
                              {state.showPrecios && (
                                <TableCell>
                                  <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                    ${producto.costoFinal?.toFixed(2)}
                                  </Typography>
                                </TableCell>
                              )}
                              <TableCell>
                                <Chip 
                                  label={producto.stock} 
                                  color={producto.stock > 5 ? 'success' : 'error'}
                                  variant="outlined"
                                  sx={{
                                    fontWeight: 'bold',
                                    boxShadow: producto.stock > 5 
                                      ? '0 2px 5px rgba(76, 175, 80, 0.2)' 
                                      : '0 2px 5px rgba(244, 67, 54, 0.2)'
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <motion.div
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleSeleccionarProducto(producto)}
                                    disabled={producto.stock <= 0}
                                    sx={{
                                      borderRadius: '8px',
                                      textTransform: 'none',
                                      fontWeight: 'bold',
                                      boxShadow: '0 2px 5px rgba(33, 150, 243, 0.3)',
                                      '&:hover': {
                                        boxShadow: '0 4px 8px rgba(33, 150, 243, 0.4)',
                                        transform: 'translateY(-2px)'
                                      },
                                      '&:disabled': {
                                        backgroundColor: 'rgba(0,0,0,0.12)',
                                        color: 'rgba(0,0,0,0.26)'
                                      },
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    <AddIcon sx={{ mr: 0.5 }} />
                                    Agregar
                                  </Button>
                                </motion.div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </motion.div>
            </Grid>

            {/* Detalle de Venta */}
            <Grid item xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Paper sx={{ 
                  p: 2, 
                  height: 500, 
                  display: 'flex', 
                  flexDirection: 'column',
                  borderRadius: '16px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 2,
                    pb: 2,
                    borderBottom: '2px solid #e0e0e0'
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 'bold',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <ShoppingCartIcon />
                      Detalle de Venta
                    </Typography>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outlined" 
                        startIcon={<VpnKey />}
                        onClick={() => setState(prev => ({ ...prev, pinDialog: true }))}
                        sx={{
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          borderColor: 'warning.main',
                          color: 'warning.main',
                          px: 3,
                          py: 1,
                          boxShadow: '0 2px 5px rgba(255, 152, 0, 0.2)',
                          '&:hover': {
                            backgroundColor: 'warning.main',
                            color: 'white',
                            boxShadow: '0 4px 8px rgba(255, 152, 0, 0.3)',
                            transform: 'translateY(-2px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        Desbloquear Costos
                      </Button>
                    </motion.div>
                  </Box>
                
                  <TableContainer sx={{ flex: 1 }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <StyledTableCell>Producto</StyledTableCell>
                          <StyledTableCell>Cantidad</StyledTableCell>
                          <StyledTableCell>P. Venta</StyledTableCell>
                          <StyledTableCell>Total</StyledTableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <AnimatePresence>
                          {state.productosVenta.map((producto, index) => (
                            <motion.tr
                              key={producto._id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              component={StyledTableRow}
                              layout
                            >
                              <TableCell>
                                <Typography sx={{ fontWeight: 'medium' }}>
                                  {producto.nombre}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip 
                                  label={producto.cantidad} 
                                  color="info" 
                                  variant="outlined"
                                  size="small"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                  ${producto.precioVenta.toFixed(2)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  ${(producto.precioVenta * producto.cantidad).toFixed(2)}
                                </Typography>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                        <TableRow sx={{ backgroundColor: 'rgba(25, 118, 210, 0.04)' }}>
                          <TableCell colSpan={3} align="right">
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              Total General:
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 'bold', 
                                color: 'primary.main',
                                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              ${totalGeneral.toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                
                  <Box sx={{ mt: 2, p: 2 }}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        variant="contained" 
                        color="success" 
                        fullWidth
                        onClick={handleFinalizarVenta}
                        disabled={state.productosVenta.length === 0}
                        sx={{ 
                          height: 50,
                          borderRadius: '12px',
                          textTransform: 'none',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                          background: 'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
                          boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #388e3c 30%, #4caf50 90%)',
                            boxShadow: '0 5px 8px 2px rgba(76, 175, 80, .4)',
                            transform: 'translateY(-2px)'
                          },
                          '&:disabled': {
                            backgroundColor: 'rgba(0,0,0,0.12)',
                            color: 'rgba(0,0,0,0.26)',
                            background: 'none'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ShoppingCartIcon sx={{ mr: 1 }} />
                        Finalizar Venta
                      </Button>
                    </motion.div>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ListadoHistorialVentas handleVerCliente={(venta) => {
              console.log('Ver cliente:', venta.cliente);
            }} />
          </motion.div>
        </TabPanel>
      </Paper>
    </motion.div>

        {/* Modal de Cantidad y Precio */}
        <AnimatePresence>
          {state.productoSeleccionado && (
            <Dialog
              open={!!state.productoSeleccionado}
              onClose={() => {
                setState(prev => ({ ...prev, productoSeleccionado: null }));
                setLotesProducto([]);
              }}
              PaperProps={{
                style: {
                  borderRadius: '16px',
                  boxShadow: '0 24px 38px rgba(0,0,0,0.14), 0 9px 46px rgba(0,0,0,0.12), 0 11px 15px rgba(0,0,0,0.2)',
                  overflow: 'hidden'
                }
              }}
              TransitionComponent={motion.div}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogTitle sx={{ 
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <AddIcon />
                  Agregar Producto
                </DialogTitle>
                <DialogContent sx={{ pt: 3, px: 3 }}>
                  {loadingLotes ? (
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      height: '100px' 
                    }}>
                      <CircularProgress size={40} thickness={4} sx={{ color: 'primary.main' }} />
                      <Typography sx={{ ml: 2 }}>Cargando lotes...</Typography>
                    </Box>
                  ) : lotesProducto.length === 0 ? (
                    <Alert severity="error" sx={{ borderRadius: '10px' }}>
                      <Typography>No hay lotes disponibles para este producto.</Typography>
                    </Alert>
                  ) : (
                    <Box component={motion.div} layout>
                      <Alert 
                        severity="info" 
                        sx={{ 
                          mb: 2, 
                          borderRadius: '10px',
                          backgroundColor: 'rgba(33, 150, 243, 0.1)'
                        }}
                      >
                        <Typography variant="subtitle2">
                          <strong>Lote seleccionado:</strong> {lotesProducto[0]?.fecha ? moment.utc(lotesProducto[0].fecha).format('DD/MM/YYYY') : 'Sin fecha'}
                          {state.showPrecios && (
                            <> | <strong>Costo:</strong> ${lotesProducto[0]?.costoFinal?.toFixed(2) || 'N/A'}</>
                          )}
                          | <strong>Stock disponible:</strong> {lotesProducto[0]?.stockLote}
                        </Typography>
                      </Alert>
                      <Grid container spacing={2} sx={{ pt: 2 }}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Cantidad"
                            type="number"
                            value={state.cantidadInput}
                            onChange={(e) => setState(prev => ({ ...prev, cantidadInput: e.target.value }))}
                            inputProps={{ 
                              min: 1, 
                              max: state.productoSeleccionado?.stock || 0 
                            }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label="Precio de Venta"
                            type="number"
                            value={state.precioVentaInput}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (/^\d*\.?\d*$/.test(value)) {
                                setState(prev => ({ ...prev, precioVentaInput: value }));
                              }
                            }}
                            inputProps={{ 
                              min: lotesProducto[0]?.costoFinal || 0,
                              step: "0.01"
                            }}
                            error={state.precioVentaInput !== '' && isNaN(state.precioVentaInput)}
                            helperText={state.precioVentaInput !== '' && isNaN(state.precioVentaInput) 
                              ? 'Ingrese un número válido' 
                              : ''
                            }
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: '12px',
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => {
                        setState(prev => ({ ...prev, productoSeleccionado: null }));
                        setLotesProducto([]);
                      }}
                      variant="outlined"
                      sx={{ 
                        borderRadius: '8px',
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancelar
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={agregarProducto} 
                      variant="contained"
                      sx={{ 
                        borderRadius: '8px',
                        px: 3,
                        background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                        boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      <AddIcon sx={{ mr: 0.5 }} />
                      Aceptar
                    </Button>
                  </motion.div>
                </DialogActions>
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>

        {/* Modal de PIN */}
        <AnimatePresence>
          {state.pinDialog && (
            <Dialog
              open={state.pinDialog}
              onClose={() => setState(prev => ({ ...prev, pinDialog: false }))}
              PaperProps={{
                style: {
                  borderRadius: '16px',
                  boxShadow: '0 24px 38px rgba(0,0,0,0.14), 0 9px 46px rgba(0,0,0,0.12), 0 11px 15px rgba(0,0,0,0.2)',
                  overflow: 'hidden'
                }
              }}
              TransitionComponent={motion.div}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
              >
                <DialogTitle sx={{ 
                  background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                  color: 'white',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <VpnKey />
                  Ingrese el PIN de seguridad
                </DialogTitle>
                <DialogContent sx={{ pt: 3, px: 3 }}>
                  <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    type="password"
                    label="PIN"
                    value={state.pinInput}
                    onChange={(e) => setState(prev => ({ ...prev, pinInput: e.target.value }))}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <VpnKey />
                        </InputAdornment>
                      ),
                      sx: { borderRadius: '12px' }
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                      }
                    }}
                  />
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => setState(prev => ({ ...prev, pinDialog: false }))}
                      variant="outlined"
                      sx={{ 
                        borderRadius: '8px',
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      Cancelar
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handlePinSubmit} 
                      variant="contained"
                      sx={{ 
                        borderRadius: '8px',
                        px: 3,
                        background: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
                        boxShadow: '0 3px 5px 2px rgba(255, 152, 0, .3)',
                        textTransform: 'none',
                        fontWeight: 'bold'
                      }}
                    >
                      <VpnKey sx={{ mr: 0.5 }} />
                      Aceptar
                    </Button>
                  </motion.div>
                </DialogActions>
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>

      {/* Modal de Confirmación de Pago */}
      <ConfirmarPagoModal
        open={state.mostrarModalPago}
        onClose={() => setState(prev => ({ ...prev, mostrarModalPago: false }))}
        fechaVenta={state.fechaVenta}
        setFechaVenta={(value) => setState(prev => ({ ...prev, fechaVenta: value }))}
        nrFactura={state.nrFactura}
        setNrFactura={(value) => setState(prev => ({ ...prev, nrFactura: value }))}
        tipoPago={state.tipoPago}
        setTipoPago={(value) => setState(prev => ({ ...prev, tipoPago: value }))}
        metodoPago={state.metodoPago}
        setMetodoPago={(value) => setState(prev => ({ ...prev, metodoPago: value }))}
        banco={state.banco}
        setBanco={(value) => setState(prev => ({ ...prev, banco: value }))}
        montoAbonar={state.montoAbonar}
        setMontoAbonar={(value) => setState(prev => ({ ...prev, montoAbonar: value }))}
        totalVenta={totalGeneral}
        errorFecha={errorFecha}
        setErrorFecha={(value) => setErrorFecha(value)}
        errorFactura={state.error}
        setErrorFactura={(value) => setState(prev => ({ ...prev, error: value }))}
        errorMonto={state.error}
        setErrorMonto={(value) => setState(prev => ({ ...prev, error: value }))}
        errorBanco={state.error}
        setErrorBanco={(value) => setState(prev => ({ ...prev, error: value }))}
        productosVenta={state.productosVenta}
        cliente={state.cliente}
        handleConfirmarPago={finalizarVenta}
        showPrecios={state.showPrecios}
      />

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

      {/* Drawer de Precios de Referencia */}
      <Drawer
        anchor="right"
        open={openPreciosDrawer}
        onClose={() => setOpenPreciosDrawer(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '500px', md: '600px' },
            backgroundColor: '#f8f9fa'
          }
        }}
      >
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header del Drawer */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            pb: 2,
            borderBottom: '2px solid #e0e0e0'
          }}>
            <Typography variant="h5" sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <PriceChangeIcon />
              Precios de Referencia
            </Typography>
            <IconButton 
              onClick={() => setOpenPreciosDrawer(false)}
              sx={{ 
                backgroundColor: 'rgba(0,0,0,0.1)',
                '&:hover': { backgroundColor: 'rgba(0,0,0,0.2)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Contenido del Drawer */}
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            {loadingPrecios ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px' 
              }}>
                <CircularProgress size={60} thickness={4} sx={{ color: 'primary.main' }} />
              </Box>
            ) : listasPrecios.length === 0 ? (
              <Alert 
                severity="info" 
                icon={<PriceChangeIcon />}
                sx={{ 
                  borderRadius: '10px',
                  '& .MuiAlert-icon': {
                    fontSize: '2rem'
                  }
                }}
              >
                <Typography variant="h6" sx={{ mb: 1 }}>No hay precios registrados</Typography>
                No se encontraron precios de referencia en el sistema
              </Alert>
            ) : (
              <Box sx={{ overflowX: 'auto', overflowY: 'auto' }}>
                <Table stickyHeader sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        backgroundColor: 'primary.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        minWidth: 120
                      }}>
                        Producto
                      </TableCell>
                      <TableCell sx={{ 
                        backgroundColor: 'primary.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        minWidth: 90
                      }}>
                        Precio 1
                      </TableCell>
                      <TableCell sx={{ 
                        backgroundColor: 'primary.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        minWidth: 90
                      }}>
                        Precio 2
                      </TableCell>
                      <TableCell sx={{ 
                        backgroundColor: 'primary.main',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '0.85rem',
                        minWidth: 90
                      }}>
                        Precio 3
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {listasPrecios.map((item, index) => (
                      <TableRow 
                        key={item._id}
                        sx={{ 
                          '&:nth-of-type(even)': { backgroundColor: 'rgba(0,0,0,0.02)' },
                          '&:hover': { backgroundColor: 'rgba(0,0,0,0.05)' }
                        }}
                      >
                        <TableCell>
                          <Tooltip title={item.nombreProducto} arrow>
                            <Typography sx={{ 
                              fontWeight: 'medium',
                              fontSize: '0.85rem',
                              maxWidth: '120px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {item.nombreProducto}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip 
                            title={formatearMoneda(item.precio1, 'USD', 'Bs', 'USD', null)} 
                            arrow
                          >
                            <Box>
                              <Typography sx={{ 
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                color: 'primary.main'
                              }}>
                                ${item.precio1.toFixed(2)}
                              </Typography>
                              <Typography sx={{ 
                                fontSize: '0.7rem',
                                color: 'text.secondary'
                              }}>
                                Bs. {(item.precio1 * tasaCambio).toFixed(2)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip 
                            title={formatearMoneda(item.precio2, 'USD', 'Bs', 'USD', null)} 
                            arrow
                          >
                            <Box>
                              <Typography sx={{ 
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                color: 'secondary.main'
                              }}>
                                ${item.precio2.toFixed(2)}
                              </Typography>
                              <Typography sx={{ 
                                fontSize: '0.7rem',
                                color: 'text.secondary'
                              }}>
                                Bs. {(item.precio2 * tasaCambio).toFixed(2)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip 
                            title={formatearMoneda(item.precio3, 'USD', 'Bs', 'USD', null)} 
                            arrow
                          >
                            <Box>
                              <Typography sx={{ 
                                fontWeight: 'bold',
                                fontSize: '0.85rem',
                                color: 'info.main'
                              }}>
                                ${item.precio3.toFixed(2)}
                              </Typography>
                              <Typography sx={{ 
                                fontSize: '0.7rem',
                                color: 'text.secondary'
                              }}>
                                Bs. {(item.precio3 * tasaCambio).toFixed(2)}
                              </Typography>
                            </Box>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Box>

          {/* Footer del Drawer */}
          <Box sx={{ 
            mt: 3, 
            pt: 2, 
            borderTop: '1px solid #e0e0e0',
            textAlign: 'center'
          }}>
            <Typography variant="caption" color="textSecondary">
              Precios en USD con equivalencia en Bolívares
            </Typography>
            <Typography variant="caption" color="textSecondary" display="block">
              Total: {listasPrecios.length} productos
            </Typography>
          </Box>
        </Box>
      </Drawer>

        {/* Notificación de deudas pendientes */}
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          <Alert 
            onClose={handleCloseSnackbar} 
            severity="warning" 
            sx={{ 
              width: '100%',
              borderRadius: '12px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>

        {/* Mostrar error si existe */}
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Alert 
              severity="error" 
              sx={{ 
                mb: 2,
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
            >
              {state.error}
            </Alert>
          </motion.div>
        )}
      </MainContainer>
    </motion.div>
  );
};

export default ProcesarVenta;