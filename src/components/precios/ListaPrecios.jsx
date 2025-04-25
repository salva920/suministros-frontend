import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress, Card, CardContent,
  Grid, Chip, useTheme, useMediaQuery, Divider, Tooltip, Zoom, Fade,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  PriceChange as PriceChangeIcon,
  MoreVert as MoreVertIcon,
  FilterAlt as FilterAltIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api";
// Nombres de los meses en español
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Componente con animación para la tarjeta de lista de precios
const AnimatedCard = ({ children, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.95 }}
    transition={{ duration: 0.3, delay: delay * 0.05 }}
    whileHover={{ scale: 1.02 }}
    className="price-card"
  >
    {children}
  </motion.div>
);

const ListaPrecios = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  // Estados básicos
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
  const [openFilterMenu, setOpenFilterMenu] = useState(false);
  
  // Vista en modo tarjeta o tabla
  const [viewMode, setViewMode] = useState('card'); // 'card' o 'table'
  
  // Paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Cargar listas de precios
  const cargarListasPrecios = async () => {
    setLoading(true);
    try {
      const params = {
        page: page + 1, // +1 porque MUI usa 0-based indexing
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

  // Generar años para el selector
  const getAniosDisponibles = () => {
    const anioActual = new Date().getFullYear();
    const anios = [];
    for (let i = anioActual - 5; i <= anioActual + 1; i++) {
      anios.push(i);
    }
    return anios;
  };

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: name.startsWith('precio') ? parseFloat(value) || '' : value
    }));
  };

  // Formatear fecha para el backend
  const formatearFecha = (fecha) => {
    if (!fecha) return new Date().toISOString();
    return new Date(fecha).toISOString();
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
      console.error('Error al guardar la lista de precios:', error);
      toast.error('Error al guardar la lista de precios');
    }
  };

  // Editar item
  const handleEdit = (item) => {
    setCurrentItem({
      ...item,
      precio1: item.precio1 || 0,
      precio2: item.precio2 || 0,
      precio3: item.precio3 || 0
    });
    setOpenDialog(true);
  };

  // Eliminar item
  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta lista de precios?')) {
      try {
        await axios.delete(`${API_URL}/listaprecios/${id}`);
        toast.success('Lista de precios eliminada correctamente');
        cargarListasPrecios();
      } catch (error) {
        console.error('Error al eliminar:', error);
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

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <motion.div
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
            Listas de Precios
          </Typography>
        </motion.div>

        {/* Barra de acciones */}
        <Paper
          elevation={3}
          sx={{
            p: 2,
            mb: 3,
            borderRadius: '12px',
            background: theme.palette.background.default
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={7}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setCurrentItem({
                        nombreProducto: '',
                        precio1: '',
                        precio2: '',
                        precio3: ''
                      });
                      setOpenDialog(true);
                    }}
                    sx={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                      fontWeight: 'bold'
                    }}
                  >
                    Nueva Lista
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={cargarListasPrecios}
                    sx={{ borderRadius: '8px' }}
                  >
                    Actualizar
                  </Button>
                </motion.div>
                
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Button
                    variant={openFilterMenu ? "contained" : "outlined"}
                    color="secondary"
                    startIcon={<FilterAltIcon />}
                    onClick={() => setOpenFilterMenu(!openFilterMenu)}
                    sx={{ borderRadius: '8px' }}
                  >
                    Filtros
                  </Button>
                </motion.div>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Buscar producto..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                variant="outlined"
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  sx: { borderRadius: '8px' }
                }}
              />
            </Grid>
            
            {openFilterMenu && (
              <Grid item xs={12}>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Paper elevation={1} sx={{ p: 2, borderRadius: '8px' }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel id="mes-select-label">Mes</InputLabel>
                          <Select
                            labelId="mes-select-label"
                            value={mesSeleccionado}
                            onChange={(e) => setMesSeleccionado(e.target.value)}
                            label="Mes"
                          >
                            <MenuItem value="">Todos los meses</MenuItem>
                            {MESES.map((mes, index) => (
                              <MenuItem key={index} value={index + 1}>{mes}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                          <InputLabel id="anio-select-label">Año</InputLabel>
                          <Select
                            labelId="anio-select-label"
                            value={anioSeleccionado}
                            onChange={(e) => setAnioSeleccionado(e.target.value)}
                            label="Año"
                          >
                            {getAniosDisponibles().map((anio) => (
                              <MenuItem key={anio} value={anio}>{anio}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* Mostrar cargando */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            >
              <CircularProgress color="primary" />
            </motion.div>
          </Box>
        )}

        {/* Mostrar datos */}
        {!loading && listasPrecios.length === 0 ? (
          <Paper
            elevation={2}
            sx={{
              p: 4,
              borderRadius: '12px',
              textAlign: 'center',
              background: theme.palette.background.default
            }}
          >
            <Typography variant="h6" color="textSecondary">
              No se encontraron listas de precios
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Intenta con otros filtros o crea una nueva lista
            </Typography>
          </Paper>
        ) : (
          <>
            {/* Vista de tarjetas */}
            {viewMode === 'card' && (
              <Grid container spacing={3}>
                <AnimatePresence>
                  {listasPrecios.map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={item._id}>
                      <AnimatedCard delay={index}>
                        <Card 
                          elevation={3}
                          sx={{
                            borderRadius: '12px',
                            overflow: 'visible',
                            position: 'relative',
                            transition: 'all 0.3s',
                            '&:hover': {
                              boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                            }
                          }}
                        >
                          <CardContent sx={{ p: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                              <Typography variant="h6" fontWeight="bold" noWrap>
                                {item.nombreProducto}
                              </Typography>
                              <Box>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(item)}
                                  color="primary"
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDelete(item._id)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>
                            
                            <Divider sx={{ my: 1.5 }} />
                            
                            <Box sx={{ mt: 2 }}>
                              <Grid container spacing={1}>
                                <Grid item xs={4}>
                                  <Chip
                                    label={`$${item.precio1}`}
                                    color="primary"
                                    size="small"
                                    variant="outlined"
                                    sx={{ width: '100%' }}
                                  />
                                </Grid>
                                <Grid item xs={4}>
                                  <Chip
                                    label={`$${item.precio2}`}
                                    color="secondary"
                                    size="small"
                                    variant="outlined"
                                    sx={{ width: '100%' }}
                                  />
                                </Grid>
                                <Grid item xs={4}>
                                  <Chip
                                    label={`$${item.precio3}`}
                                    color="info"
                                    size="small"
                                    variant="outlined"
                                    sx={{ width: '100%' }}
                                  />
                                </Grid>
                              </Grid>
                            </Box>
                            
                            {item.fechaCreacion && (
                              <Typography 
                                variant="caption" 
                                color="textSecondary"
                                sx={{ 
                                  display: 'block',
                                  mt: 2,
                                  textAlign: 'right'
                                }}
                              >
                                {new Date(item.fechaCreacion).toLocaleDateString()}
                              </Typography>
                            )}
                          </CardContent>
                        </Card>
                      </AnimatedCard>
                    </Grid>
                  ))}
                </AnimatePresence>
              </Grid>
            )}

            {/* Paginación */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <TablePagination
                component="div"
                count={totalItems}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Por página:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
              />
            </Box>
          </>
        )}

        {/* Diálogo para crear/editar */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
          fullWidth
          TransitionComponent={Fade}
          TransitionProps={{ timeout: 400 }}
        >
          <DialogTitle sx={{ pb: 1 }}>
            <motion.div
              initial={{ x: -20 }}
              animate={{ x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentItem._id ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
            </motion.div>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <TextField
                  fullWidth
                  margin="dense"
                  name="nombreProducto"
                  label="Nombre del Producto"
                  value={currentItem.nombreProducto || ''}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      margin="dense"
                      name="precio1"
                      label="Precio 1"
                      type="number"
                      value={currentItem.precio1 || ''}
                      onChange={handleChange}
                      InputProps={{ 
                        startAdornment: (
                          <motion.div 
                            whileHover={{ scale: 1.1, color: theme.palette.primary.main }}
                          >
                            <PriceChangeIcon sx={{ mr: 1, color: theme.palette.primary.main }} />
                          </motion.div>
                        ) 
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      margin="dense"
                      name="precio2"
                      label="Precio 2"
                      type="number"
                      value={currentItem.precio2 || ''}
                      onChange={handleChange}
                      InputProps={{ 
                        startAdornment: (
                          <motion.div 
                            whileHover={{ scale: 1.1, color: theme.palette.secondary.main }}
                          >
                            <PriceChangeIcon sx={{ mr: 1, color: theme.palette.secondary.main }} />
                          </motion.div>
                        ) 
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      margin="dense"
                      name="precio3"
                      label="Precio 3"
                      type="number"
                      value={currentItem.precio3 || ''}
                      onChange={handleChange}
                      InputProps={{ 
                        startAdornment: (
                          <motion.div 
                            whileHover={{ scale: 1.1, color: theme.palette.info.main }}
                          >
                            <PriceChangeIcon sx={{ mr: 1, color: theme.palette.info.main }} />
                          </motion.div>
                        ) 
                      }}
                    />
                  </Grid>
                </Grid>
              </motion.div>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, background: theme.palette.background.default }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={() => setOpenDialog(false)} 
                color="inherit"
                variant="outlined"
                sx={{ borderRadius: '8px' }}
              >
                Cancelar
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                onClick={handleSubmit} 
                color="primary" 
                variant="contained"
                sx={{ 
                  borderRadius: '8px',
                  boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                  fontWeight: 'bold'
                }}
              >
                {currentItem._id ? 'Actualizar' : 'Guardar'}
              </Button>
            </motion.div>
          </DialogActions>
        </Dialog>
        
        <ToastContainer position="bottom-right" />
      </Container>
    </motion.div>
  );
};

export default ListaPrecios; 