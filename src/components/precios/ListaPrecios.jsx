import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress, Grid, FormControl,
  InputLabel, Select, MenuItem, Paper, Chip, useTheme, useMediaQuery, Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PriceChange as PriceChangeIcon,
  FilterAlt as FilterAltIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Nombres de los meses en español
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

// Estilo personalizado para el contenedor principal
const containerStyle = {
  backgroundImage: 'linear-gradient(120deg, #f8f9fa 0%, #ffffff 100%)',
  borderRadius: '16px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
  padding: '24px',
  marginTop: '16px',
  marginBottom: '16px',
  overflow: 'hidden',
  position: 'relative'
};

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
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

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
      <Container style={containerStyle} maxWidth="xl">
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <motion.div variants={itemVariants}>
            <Typography 
              variant="h4" 
              fontWeight="bold" 
              sx={{ 
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Listado de Precios
            </Typography>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setOpenDialog(true);
                setCurrentItem({ nombreProducto: '', precio1: '', precio2: '', precio3: '' });
              }}
              sx={{ 
                borderRadius: '28px',
                padding: '8px 24px',
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                fontWeight: 'bold',
                textTransform: 'none'
              }}
            >
              Agregar nuevo
            </Button>
          </motion.div>
        </Box>

        <motion.div variants={itemVariants}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar por nombre"
                  variant="outlined"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
                    sx: { borderRadius: '8px' }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={8}>
                <Box 
                  display="flex" 
                  justifyContent="space-between" 
                  alignItems="center"
                  flexWrap={isMobile ? "wrap" : "nowrap"}
                  gap={2}
                >
                  <Box display="flex" alignItems="center" gap={2} flexGrow={1}>
                    <FormControl variant="outlined" sx={{ minWidth: 120 }} fullWidth={isMobile}>
                      <InputLabel>Mes</InputLabel>
                      <Select
                        value={mesSeleccionado}
                        onChange={(e) => setMesSeleccionado(e.target.value)}
                        label="Mes"
                      >
                        <MenuItem value="">
                          <em>Todos</em>
                        </MenuItem>
                        {MESES.map((mes, index) => (
                          <MenuItem key={index} value={index + 1}>{mes}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    
                    <FormControl variant="outlined" sx={{ minWidth: 120 }} fullWidth={isMobile}>
                      <InputLabel>Año</InputLabel>
                      <Select
                        value={anioSeleccionado}
                        onChange={(e) => setAnioSeleccionado(e.target.value)}
                        label="Año"
                      >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(anio => (
                          <MenuItem key={anio} value={anio}>{anio}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button 
                      variant="outlined" 
                      onClick={handleClearFilters} 
                      startIcon={<CloseIcon />}
                      sx={{ borderRadius: '8px' }}
                    >
                      {isMobile ? '' : 'Limpiar filtros'}
                    </Button>
                  </motion.div>
                </Box>
              </Grid>
            </Grid>
          </Paper>
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper 
              elevation={3} 
              sx={{ 
                borderRadius: '12px', 
                overflow: 'hidden',
                backgroundColor: 'rgba(255, 255, 255, 0.95)'
              }}
            >
              <TableContainer>
                <Table>
                  <TableHead sx={{ backgroundColor: 'rgba(33, 150, 243, 0.1)' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nombre del Producto</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Precio 1</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Precio 2</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Precio 3</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <AnimatePresence>
                      {listasPrecios.map((item, index) => (
                        <motion.tr
                          key={item._id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          whileHover={{ backgroundColor: 'rgba(33, 150, 243, 0.05)' }}
                          component={TableRow}
                        >
                          <TableCell>{item.nombreProducto}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`$${item.precio1}`} 
                              color="primary" 
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`$${item.precio2}`} 
                              color="secondary" 
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={`$${item.precio3}`} 
                              color="info" 
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1}>
                              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                <IconButton 
                                  color="primary"
                                  onClick={() => {
                                    setCurrentItem(item);
                                    setOpenDialog(true);
                                  }}
                                  size="small"
                                  sx={{ 
                                    background: 'rgba(33, 150, 243, 0.1)',
                                    transition: 'all 0.3s'
                                  }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </motion.div>

                              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                                <IconButton 
                                  color="error"
                                  onClick={() => handleDelete(item._id)}
                                  size="small"
                                  sx={{ 
                                    background: 'rgba(211, 47, 47, 0.1)',
                                    transition: 'all 0.3s'
                                  }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </motion.div>
                            </Box>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {listasPrecios.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          <Typography variant="body1" color="textSecondary">
                            No hay datos disponibles
                          </Typography>
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
                  rowsPerPageOptions={[5, 10, 25, 50]}
                  labelRowsPerPage="Filas por página:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
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
                          label="Precio 1"
                          type="number"
                          value={currentItem.precio1 || ''}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: <PriceChangeIcon color="primary" sx={{ mr: 1 }} />,
                            sx: { borderRadius: '8px' }
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
                            startAdornment: <PriceChangeIcon color="secondary" sx={{ mr: 1 }} />,
                            sx: { borderRadius: '8px' }
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
                            startAdornment: <PriceChangeIcon color="info" sx={{ mr: 1 }} />,
                            sx: { borderRadius: '8px' }
                          }}
                        />
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

export default ListaPrecios; 