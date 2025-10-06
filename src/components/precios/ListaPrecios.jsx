import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress, Grid, FormControl,
  InputLabel, Select, MenuItem, Paper, Chip, useTheme, useMediaQuery, Divider,
  Alert
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PriceChange as PriceChangeIcon,
  FilterAlt as FilterAltIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Dashboard
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import TasaCambio from '../TasaCambio';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Nombres de los meses en español
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
  visible: { opacity: 1, y: 0 }
};

const ListaPrecios = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  
  const [listasPrecios, setListasPrecios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState({
    nombreProducto: '',
    precio1: '',
    precio2: '',
    precio3: ''
  });
  
  // Estado para búsqueda y filtros
  const [busqueda, setBusqueda] = useState('');
  const [mesSeleccionado, setMesSeleccionado] = useState('');
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [showFilters, setShowFilters] = useState(false);
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(1000); // Mostrar todos los productos por defecto
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Estados para tasa de cambio
  const [tasaCambio, setTasaCambio] = useState(156.37); // Tasa por defecto

  // Cargar listas de precios
  const cargarListasPrecios = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        busqueda,
        mes: mesSeleccionado,
        anio: anioSeleccionado
      };
      
      const response = await axios.get(`${API_URL}/listaprecios`, { params });
      
      setListasPrecios(response.data.listasPrecios || []);
      setTotalItems(response.data.totalDocs || 0);
      setTotalPages(response.data.totalPages || 0);
    } catch (error) {
      console.error('Error al cargar listas de precios:', error);
      toast.error('Error al cargar las listas de precios');
      setListasPrecios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarListasPrecios();
  }, [page, rowsPerPage, busqueda, mesSeleccionado, anioSeleccionado]);

  // Agregar useEffect para obtener la tasa de cambio inicial
  useEffect(() => {
    const obtenerTasaCambio = async () => {
      try {
        const response = await axios.get(`${API_URL}/tasa-cambio`);
        setTasaCambio(response.data.tasa);
      } catch (error) {
        console.error('Error al obtener la tasa de cambio:', error);
        toast.error('Error al obtener la tasa de cambio');
      }
    };

    obtenerTasaCambio();
  }, []);

  // Función para manejar cambios en la tasa de cambio
  const handleTasaChange = (nuevaTasa) => {
    setTasaCambio(nuevaTasa);
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

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: name.startsWith('precio') ? parseFloat(value) || '' : value
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async () => {
    try {
      if (!currentItem.nombreProducto) {
        toast.warning('El nombre del producto es obligatorio');
        return;
      }

      const data = {
        ...currentItem,
        precio1: parseFloat(currentItem.precio1) || 0,
        precio2: parseFloat(currentItem.precio2) || 0,
        precio3: parseFloat(currentItem.precio3) || 0
      };

      if (currentItem._id) {
        await axios.put(`${API_URL}/listaprecios/${currentItem._id}`, data);
        toast.success('Lista de precios actualizada correctamente');
      } else {
        await axios.post(`${API_URL}/listaprecios`, data);
        toast.success('Lista de precios creada correctamente');
      }

      setOpenDialog(false);
      cargarListasPrecios();
      setCurrentItem({ nombreProducto: '', precio1: '', precio2: '', precio3: '' });
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error(`Error al guardar: ${error.message}`);
    }
  };

  // Manejar eliminación
  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta lista de precios?')) {
      try {
        await axios.delete(`${API_URL}/listaprecios/${id}`);
        toast.success('Lista de precios eliminada correctamente');
        cargarListasPrecios();
      } catch (error) {
        console.error('Error al eliminar la lista de precios:', error);
        toast.error('Error al eliminar la lista de precios');
      }
    }
  };

  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Limpiar filtros
  const handleClearFilters = () => {
    setBusqueda('');
    setMesSeleccionado('');
    setAnioSeleccionado(new Date().getFullYear());
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <MainContainer maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 2 }}>
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

        {/* Título y Tasa de Cambio en la misma fila */}
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
                flex: 1
              }}
            >
              Listado de Precios
            </Typography>
            
            {/* Tasa de Cambio alineada con el título */}
            <Box sx={{ 
              maxWidth: '400px',
              ml: 2
            }}>
              <TasaCambio onTasaChange={handleTasaChange} />
            </Box>
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
                onClick={handleClearFilters}
                sx={{ textTransform: 'none' }}
              >
                Reiniciar filtros
              </Button>
            </Box>
            
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="Buscar por nombre"
                  variant="outlined"
                  size="small"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="primary" sx={{ mr: 1 }} />,
                    sx: { borderRadius: '10px' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel>Mes</InputLabel>
                  <Select
                    value={mesSeleccionado}
                    onChange={(e) => setMesSeleccionado(e.target.value)}
                    label="Mes"
                    sx={{ borderRadius: '10px' }}
                  >
                    <MenuItem value="">
                      <em>Todos</em>
                    </MenuItem>
                    {MESES.map((mes, index) => (
                      <MenuItem key={index} value={index + 1}>{mes}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <FormControl variant="outlined" size="small" fullWidth>
                  <InputLabel>Año</InputLabel>
                  <Select
                    value={anioSeleccionado}
                    onChange={(e) => setAnioSeleccionado(e.target.value)}
                    label="Año"
                    sx={{ borderRadius: '10px' }}
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(anio => (
                      <MenuItem key={anio} value={anio}>{anio}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </FilterContainer>
        </motion.div>
        
        {/* Botón Agregar nuevo */}
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
                onClick={() => {
                  setOpenDialog(true);
                  setCurrentItem({ nombreProducto: '', precio1: '', precio2: '', precio3: '' });
                }}
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
                Agregar nuevo
              </Button>
            </motion.div>
          </Box>
        </motion.div>

        {loading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <CircularProgress size={60} thickness={4} sx={{ color: '#2196F3' }} />
            </motion.div>
          </Box>
        ) : (
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
                      <StyledTableCell>Nombre del Producto</StyledTableCell>
                      <StyledTableCell align="center">Precio 1 (USD)</StyledTableCell>
                      <StyledTableCell align="center">Precio 2 (USD)</StyledTableCell>
                      <StyledTableCell align="center">Precio 3 (USD)</StyledTableCell>
                      <StyledTableCell align="center">Acciones</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {listasPrecios.map((item, index) => (
                        <motion.tr
                          key={item._id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.02 }}
                          component={StyledTableRow}
                          layout
                        >
                          <TableCell>
                            <Typography 
                              sx={{ 
                                maxWidth: '200px', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis', 
                                whiteSpace: 'nowrap',
                                fontWeight: 'medium'
                              }}
                            >
                              {item.nombreProducto}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={formatearMoneda(item.precio1, 'USD', 'Bs', 'USD', null)} 
                              color="primary" 
                              variant="outlined"
                              size="small"
                              sx={{ 
                                fontWeight: 'bold',
                                boxShadow: '0 2px 5px rgba(33, 150, 243, 0.2)'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={formatearMoneda(item.precio2, 'USD', 'Bs', 'USD', null)} 
                              color="secondary" 
                              variant="outlined"
                              size="small"
                              sx={{ 
                                fontWeight: 'bold',
                                boxShadow: '0 2px 5px rgba(156, 39, 176, 0.2)'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={formatearMoneda(item.precio3, 'USD', 'Bs', 'USD', null)} 
                              color="info" 
                              variant="outlined"
                              size="small"
                              sx={{ 
                                fontWeight: 'bold',
                                boxShadow: '0 2px 5px rgba(0, 188, 212, 0.2)'
                              }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                              <motion.div
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <IconButton 
                                  color="primary"
                                  onClick={() => {
                                    setCurrentItem(item);
                                    setOpenDialog(true);
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
                                  <EditIcon />
                                </IconButton>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.15 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <IconButton 
                                  color="error"
                                  onClick={() => handleDelete(item._id)}
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
                            </Box>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {listasPrecios.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                          <Alert 
                            severity="info" 
                            icon={<PriceChangeIcon fontSize="inherit" />}
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
                            <Typography variant="h6" sx={{ mb: 1 }}>No hay productos</Typography>
                            No hay productos que coincidan con los filtros aplicados
                          </Alert>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                px={2}
                py={1.5}
                bgcolor="#f8f9fa"
              >
                <Typography variant="body2" color="textSecondary">
                  Total: {totalItems} productos
                </Typography>
                <TablePagination
                  component="div"
                  count={totalItems}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 25, 50, 100, 1000]}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) => 
                    rowsPerPage >= count ? `Todos los ${count} productos` : `${from}-${to} de ${count}`
                  }
                  sx={{ 
                    m: 0, 
                    borderTop: 'none',
                    '.MuiTablePagination-select': {
                      borderRadius: '4px'
                    }
                  }}
                />
              </Box>
            </Paper>
          </motion.div>
        )}

        <AnimatePresence>
          {openDialog && (
            <Dialog 
              open={openDialog} 
              onClose={() => setOpenDialog(false)}
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
                  fontWeight: 'bold'
                }}>
                  {currentItem._id ? 'Editar Precio' : 'Nuevo Precio'}
                </DialogTitle>
                <DialogContent sx={{ pt: 3, px: 3 }}>
                  <Box component={motion.div} layout>
                    <TextField
                      fullWidth
                      margin="dense"
                      name="nombreProducto"
                      label="Nombre del Producto"
                      value={currentItem.nombreProducto || ''}
                      onChange={handleChange}
                      required
                      variant="outlined"
                      sx={{ mb: 3 }}
                      InputProps={{
                        sx: { borderRadius: '8px' }
                      }}
                    />
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          margin="dense"
                          name="precio1"
                          label="Precio 1 (USD)"
                          type="number"
                          value={currentItem.precio1 || ''}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: <PriceChangeIcon color="primary" sx={{ mr: 1 }} />,
                            sx: { borderRadius: '8px' }
                          }}
                        />
                        {currentItem.precio1 && tasaCambio > 0 && (
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            Equivalente: Bs. {((currentItem.precio1 || 0) * tasaCambio).toFixed(2)}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          margin="dense"
                          name="precio2"
                          label="Precio 2 (USD)"
                          type="number"
                          value={currentItem.precio2 || ''}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: <PriceChangeIcon color="secondary" sx={{ mr: 1 }} />,
                            sx: { borderRadius: '8px' }
                          }}
                        />
                        {currentItem.precio2 && tasaCambio > 0 && (
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            Equivalente: Bs. {((currentItem.precio2 || 0) * tasaCambio).toFixed(2)}
                          </Typography>
                        )}
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <TextField
                          fullWidth
                          margin="dense"
                          name="precio3"
                          label="Precio 3 (USD)"
                          type="number"
                          value={currentItem.precio3 || ''}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: <PriceChangeIcon color="info" sx={{ mr: 1 }} />,
                            sx: { borderRadius: '8px' }
                          }}
                        />
                        {currentItem.precio3 && tasaCambio > 0 && (
                          <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                            Equivalente: Bs. {((currentItem.precio3 || 0) * tasaCambio).toFixed(2)}
                          </Typography>
                        )}
                      </Grid>
                    </Grid>
                  </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={() => setOpenDialog(false)}
                      variant="outlined"
                      sx={{ 
                        borderRadius: '8px',
                        px: 3,
                        textTransform: 'none'
                      }}
                    >
                      Cancelar
                    </Button>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      onClick={handleSubmit}
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
                      {currentItem._id ? 'Actualizar' : 'Guardar'}
                    </Button>
                  </motion.div>
                </DialogActions>
              </motion.div>
            </Dialog>
          )}
        </AnimatePresence>
      </MainContainer>
    </motion.div>
  );
};

export default ListaPrecios; 