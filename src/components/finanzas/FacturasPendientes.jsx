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
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import moment from 'moment';

// URL de la API
const API_URL = "https://suministros-backend.vercel.app/api/facturaPendiente";

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
  
  // Estados para manejar datos y UI
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendientes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Estados para modal de abono
  const [openAbonoModal, setOpenAbonoModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [errorAbono, setErrorAbono] = useState('');
  
  // Estados para modal de nueva factura
  const [openNuevaFacturaModal, setOpenNuevaFacturaModal] = useState(false);
  const [nuevaFactura, setNuevaFactura] = useState({
    concepto: '',
    proveedor: '',
    numeroFactura: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0]
  });
  
  // Función para formatear fecha de manera simple
  const formatearFechaSimple = (fechaString) => {
    if (!fechaString) return 'No disponible';
    try {
      const fecha = moment.utc(fechaString).local();
      if (!fecha.isValid()) return 'Fecha inválida';
      return fecha.format('DD/MM/YYYY');
    } catch (error) {
      return 'Error de formato';
    }
  };
  
  // Función para formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(valor);
  };
  
  // Cargar facturas pendientes con paginación
  const cargarFacturas = useCallback(async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams({
        page: page + 1, // API usa 1-indexed pages
        limit: rowsPerPage,
        estado: filtroEstado,
        busqueda
      });
      
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);
      
      const response = await axios.get(`${API_URL}?${params.toString()}`);
      
      setFacturas(response.data.facturas);
      setTotalItems(response.data.totalDocs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error al cargar facturas pendientes:', error);
      toast.error('No se pudieron cargar las facturas pendientes');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filtroEstado, busqueda, fechaDesde, fechaHasta]);
  
  // Cargar facturas cuando cambien los filtros, página o límite
  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);
  
  // Manejador de cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manejador de cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Función para buscar facturas (con debounce)
  const buscarFacturas = debounce((valor) => {
    setBusqueda(valor);
    setPage(0);
  }, 500);
  
  // Manejador de cambio en búsqueda
  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    buscarFacturas(valor);
  };
  
  // Manejador de cambio en filtro de estado
  const handleFiltroEstadoChange = (e) => {
    setFiltroEstado(e.target.value);
    setPage(0);
  };
  
  // Manejador de cambio en fecha desde
  const handleFechaDesdeChange = (e) => {
    setFechaDesde(e.target.value);
    setPage(0);
  };
  
  // Manejador de cambio en fecha hasta
  const handleFechaHastaChange = (e) => {
    setFechaHasta(e.target.value);
    setPage(0);
  };
  
  // Abrir modal de abono
  const abrirModalAbono = (factura) => {
    setFacturaSeleccionada(factura);
    setMontoAbono('');
    setErrorAbono('');
    setOpenAbonoModal(true);
  };
  
  // Registrar abono
  const handleRegistrarAbono = async () => {
    if (!montoAbono || isNaN(montoAbono) || parseFloat(montoAbono) <= 0) {
      setErrorAbono('Ingrese un monto válido');
      return;
    }
    
    if (parseFloat(montoAbono) > facturaSeleccionada.saldo) {
      setErrorAbono('El abono no puede superar el saldo pendiente');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/${facturaSeleccionada._id}/abonos`, {
        monto: parseFloat(montoAbono)
      });
      
      toast.success('Abono registrado correctamente');
      setOpenAbonoModal(false);
      cargarFacturas();
    } catch (error) {
      console.error('Error al registrar abono:', error);
      toast.error('Error al registrar el abono');
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir modal de nueva factura
  const abrirModalNuevaFactura = () => {
    setNuevaFactura({
      concepto: '',
      proveedor: '',
      numeroFactura: '',
      monto: '',
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
      await axios.post(API_URL, nuevaFactura);
      
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
      await axios.delete(`${API_URL}/${facturaId}`);
      
      toast.success('Factura eliminada correctamente');
      cargarFacturas();
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      toast.error('Error al eliminar la factura');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <MainContainer maxWidth="lg">
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
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
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
                mb: isMobile ? 2 : 0
              }}
            >
              Facturas Pendientes
            </Typography>
            
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
                  padding: '10px 20px',
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                  textTransform: 'none',
                  fontWeight: 'bold',
                  width: isMobile ? '100%' : 'auto'
                }}
              >
                Nueva Factura
              </Button>
            </motion.div>
          </Box>
        </motion.div>
        
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
                  setFiltroEstado('pendientes');
                  setFechaDesde('');
                  setFechaHasta('');
                  setPage(0);
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
                    <StyledTableCell>Fecha</StyledTableCell>
                    <StyledTableCell>Concepto</StyledTableCell>
                    <StyledTableCell>Proveedor</StyledTableCell>
                    <StyledTableCell>N° Factura</StyledTableCell>
                    <StyledTableCell align="right">Monto</StyledTableCell>
                    <StyledTableCell align="right">Abonado</StyledTableCell>
                    <StyledTableCell align="right">Saldo</StyledTableCell>
                    <StyledTableCell align="center">Acciones</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {loading && facturas.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
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
                        <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
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
                          className={factura.saldo === 0 ? 'pagada' : ''}
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
                                  fontWeight: factura.saldo === 0 ? 'normal' : 'medium'
                                }}
                              >
                                {factura.concepto}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{factura.proveedor || '-'}</TableCell>
                          <TableCell>{factura.numeroFactura || '-'}</TableCell>
                          <TableCell align="right">{formatearMoneda(factura.monto)}</TableCell>
                          <TableCell align="right">{formatearMoneda(factura.abono)}</TableCell>
                          <TableCell align="right">
                            <motion.div whileHover={{ scale: 1.05 }}>
                              <Chip 
                                label={formatearMoneda(factura.saldo)}
                                color={factura.saldo === 0 ? 'success' : factura.abono > 0 ? 'warning' : 'error'}
                                variant={factura.saldo === 0 ? 'filled' : 'outlined'}
                                sx={{ 
                                  fontWeight: 'bold',
                                  boxShadow: factura.saldo === 0 ? '0 2px 5px rgba(76, 175, 80, 0.4)' : 'none'
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
                                      onClick={() => abrirModalAbono(factura)}
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
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalItems}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              sx={{
                borderTop: '1px solid rgba(224, 224, 224, 1)',
                '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                  fontWeight: 'medium'
                }
              }}
            />
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
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                    Detalles de la Factura
                  </Typography>
                  
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 2, 
                      bgcolor: '#f8f9fa',
                      borderRadius: '10px',
                      border: '1px solid rgba(0,0,0,0.05)'
                    }}
                  >
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
                          {formatearMoneda(facturaSeleccionada.monto)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Total Abonado:</Typography>
                        <Typography variant="body1" gutterBottom color="success.main">
                          {formatearMoneda(facturaSeleccionada.abono)}
                        </Typography>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <Typography variant="subtitle2" color="text.secondary">Saldo Pendiente:</Typography>
                        <Typography variant="body1" gutterBottom color="error.main" fontWeight="bold">
                          {formatearMoneda(facturaSeleccionada.saldo)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>
                  
                  <TextField
                    fullWidth
                    label="Monto a Abonar"
                    type="number"
                    value={montoAbono}
                    onChange={(e) => setMontoAbono(e.target.value)}
                    error={!!errorAbono}
                    helperText={errorAbono}
                    margin="normal"
                    variant="outlined"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">Bs.</InputAdornment>
                      ),
                      sx: { borderRadius: '10px' }
                    }}
                    sx={{ mt: 3 }}
                  />
                  
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    mt: 2,
                    gap: 2
                  }}>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{ flex: 1 }}
                    >
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={() => setMontoAbono((facturaSeleccionada.saldo / 2).toFixed(2))}
                        sx={{ 
                          borderRadius: '10px',
                          py: 1
                        }}
                      >
                        50% ({formatearMoneda(facturaSeleccionada.saldo / 2)})
                      </Button>
                    </motion.div>
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      style={{ flex: 1 }}
                    >
                      <Button
                        variant="outlined"
                        color="success"
                        fullWidth
                        onClick={() => setMontoAbono(facturaSeleccionada.saldo.toFixed(2))}
                        sx={{ 
                          borderRadius: '10px',
                          py: 1
                        }}
                      >
                        100% ({formatearMoneda(facturaSeleccionada.saldo)})
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
                    
                    <Grid item xs={12}>
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
                              <MoneyIcon color="primary" sx={{ mr: 0.5 }} /> Bs.
                            </InputAdornment>
                          ),
                          sx: { borderRadius: '10px' }
                        }}
                      />
                    </Grid>
                  </Grid>
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