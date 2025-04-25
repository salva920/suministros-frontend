import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress, Card, CardContent,
  Grid, Chip, useTheme, useMediaQuery, Divider, Tooltip, Zoom, Fade
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  PriceChange as PriceChangeIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

// Contenedor de acciones con animación
const ActionButtonContainer = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    whileHover={{ scale: 1.05 }}
    className="action-buttons"
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
  
  // Estado para búsqueda
  const [busqueda, setBusqueda] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  
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
      const response = await axios.get(`${API_URL}/listaprecios`, {
        params: {
          page: page + 1, // +1 porque MUI usa 0-based indexing
          limit: rowsPerPage,
          busqueda
        }
      });
      
      // Usar la estructura de respuesta de mongoose-paginate-v2
      setListasPrecios(response.data.listasPrecios || []);
      setTotalItems(response.data.totalDocs || 0);
      setTotalPages(response.data.totalPages || 0);
      
      toast.success('Listas de precios actualizadas', {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    } catch (error) {
      console.error('Error al cargar listas de precios:', error);
      toast.error('Error al cargar las listas de precios', {
        position: "bottom-right",
        autoClose: 4000,
      });
      setListasPrecios([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarListasPrecios();
  }, [page, rowsPerPage, busqueda]);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: name.startsWith('precio') ? parseFloat(value) || '' : value
    }));
  };

  // Guardar lista de precios
  const handleSubmit = async () => {
    try {
      // Validar campos requeridos
      if (!currentItem.nombreProducto) {
        toast.error('El nombre del producto es obligatorio');
        return;
      }
      
      if (currentItem._id) {
        // Actualizar existente
        await axios.put(`${API_URL}/listaprecios/${currentItem._id}`, currentItem);
        toast.success('Lista de precios actualizada correctamente');
      } else {
        // Crear nueva
        await axios.post(`${API_URL}/listaprecios`, currentItem);
        toast.success('Lista de precios creada correctamente');
      }
      
      setOpenDialog(false);
      cargarListasPrecios();
      
    } catch (error) {
      console.error('Error al guardar:', error);
      toast.error('Error al guardar la lista de precios');
    }
  };

  // Eliminar lista de precios con confirmación animada
  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar esta lista de precios?')) {
      try {
        await axios.delete(`${API_URL}/listaprecios/${id}`);
        
        // Animación para la lista que se elimina
        const updatedListas = listasPrecios.filter(item => item._id !== id);
        setListasPrecios(updatedListas);
        
        toast.success('Lista de precios eliminada correctamente');
      } catch (error) {
        console.error('Error al eliminar:', error);
        toast.error('Error al eliminar la lista de precios');
      }
    }
  };

  // Paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Renderizado de vista de tarjetas
  const renderCardView = () => (
    <motion.div layout>
      <Grid container spacing={2}>
        <AnimatePresence>
          {listasPrecios.length > 0 ? (
            listasPrecios.map((lista, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={lista._id}>
                <AnimatedCard delay={index}>
                  <Card 
                    elevation={3} 
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      background: theme.palette.background.paper,
                      position: 'relative',
                    }}
                  >
                    <Box 
                      sx={{ 
                        p: 1, 
                        background: theme.palette.primary.main,
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
                        {lista.nombreProducto}
                      </Typography>
                      <Box>
                        <ActionButtonContainer>
                          <IconButton 
                            size="small" 
                            sx={{ color: 'white' }}
                            onClick={() => {
                              setCurrentItem(lista);
                              setOpenDialog(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            sx={{ color: 'white' }}
                            onClick={() => handleDelete(lista._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </ActionButtonContainer>
                      </Box>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, p: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Precios:
                        </Typography>
                        <Grid container spacing={1}>
                          <Grid item xs={4}>
                            <Chip 
                              label={`Precio 1: $${lista.precio1?.toFixed(2) || '0.00'}`} 
                              size="small"
                              color="primary"
                              variant="outlined"
                              sx={{ width: '100%' }}
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <Chip 
                              label={`Precio 2: $${lista.precio2?.toFixed(2) || '0.00'}`} 
                              size="small"
                              color="secondary"
                              variant="outlined"
                              sx={{ width: '100%' }}
                            />
                          </Grid>
                          <Grid item xs={4}>
                            <Chip 
                              label={`Precio 3: $${lista.precio3?.toFixed(2) || '0.00'}`} 
                              size="small"
                              color="info"
                              variant="outlined"
                              sx={{ width: '100%' }}
                            />
                          </Grid>
                        </Grid>
                      </Box>
                    </CardContent>
                  </Card>
                </AnimatedCard>
              </Grid>
            ))
          ) : (
            <Grid item xs={12}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="subtitle1" color="text.secondary">
                    No hay listas de precios disponibles
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          )}
        </AnimatePresence>
      </Grid>
    </motion.div>
  );

  // Renderizado de vista de tabla
  const renderTableView = () => (
    <TableContainer sx={{ maxHeight: 440, borderRadius: '12px', overflow: 'hidden' }}>
      <Table stickyHeader aria-label="sticky table">
        <TableHead>
          <TableRow>
            <TableCell sx={{ 
              fontWeight: 'bold', 
              bgcolor: theme.palette.primary.main, 
              color: 'white'
            }}>Producto</TableCell>
            <TableCell sx={{ 
              fontWeight: 'bold', 
              bgcolor: theme.palette.primary.main, 
              color: 'white'
            }}>Precio 1</TableCell>
            <TableCell sx={{ 
              fontWeight: 'bold', 
              bgcolor: theme.palette.primary.main, 
              color: 'white'
            }}>Precio 2</TableCell>
            <TableCell sx={{ 
              fontWeight: 'bold', 
              bgcolor: theme.palette.primary.main, 
              color: 'white'
            }}>Precio 3</TableCell>
            <TableCell sx={{ 
              fontWeight: 'bold', 
              bgcolor: theme.palette.primary.main, 
              color: 'white'
            }}>Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <AnimatePresence>
            {listasPrecios.length > 0 ? (
              listasPrecios.map((lista, index) => (
                <motion.tr
                  key={lista._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  component={motion.tr}
                >
                  <TableRow hover>
                    <TableCell>{lista.nombreProducto}</TableCell>
                    <TableCell>${lista.precio1?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>${lista.precio2?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>${lista.precio3?.toFixed(2) || '0.00'}</TableCell>
                    <TableCell>
                      <ActionButtonContainer>
                        <Tooltip title="Editar" TransitionComponent={Zoom} arrow>
                          <IconButton 
                            color="primary" 
                            size="small"
                            onClick={() => {
                              setCurrentItem(lista);
                              setOpenDialog(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Eliminar" TransitionComponent={Zoom} arrow>
                          <IconButton 
                            color="error"
                            size="small"
                            onClick={() => handleDelete(lista._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </ActionButtonContainer>
                    </TableCell>
                  </TableRow>
                </motion.tr>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography variant="subtitle1" color="text.secondary">
                    No hay listas de precios disponibles
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </TableContainer>
  );

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
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom 
            color="primary"
            sx={{ 
              fontWeight: 'bold',
              borderBottom: `2px solid ${theme.palette.primary.main}`,
              pb: 1,
              display: 'inline-block'
            }}
          >
            Gestión de Listas de Precios
          </Typography>
        </motion.div>
        
        {/* Barra de herramientas animada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              p: 2, 
              mb: 3, 
              borderRadius: '12px',
              background: theme.palette.background.paper,
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={6}>
                <motion.div
                  whileFocus={{ scale: 1.02 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <TextField
                    label="Buscar producto"
                    variant="outlined"
                    size="small"
                    fullWidth
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    InputProps={{
                      startAdornment: (
                        <motion.div
                          animate={{ rotate: searchFocused ? 360 : 0 }}
                          transition={{ duration: 0.5 }}
                          style={{ marginRight: '8px' }}
                        >
                          <SearchIcon color="action" />
                        </motion.div>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      }
                    }}
                  />
                </motion.div>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <ActionButtonContainer>
                    <Tooltip title="Cambiar vista" TransitionComponent={Zoom} arrow>
                      <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setViewMode(viewMode === 'card' ? 'table' : 'card')}
                        startIcon={<MoreVertIcon />}
                        size={isMobile ? "small" : "medium"}
                      >
                        {viewMode === 'card' ? 'Tabla' : 'Tarjetas'}
                      </Button>
                    </Tooltip>
                  </ActionButtonContainer>
                  <ActionButtonContainer>
                    <Tooltip title="Actualizar datos" TransitionComponent={Zoom} arrow>
                      <Button
                        variant="outlined"
                        color="primary"
                        startIcon={<RefreshIcon />}
                        onClick={() => cargarListasPrecios()}
                        size={isMobile ? "small" : "medium"}
                      >
                        Actualizar
                      </Button>
                    </Tooltip>
                  </ActionButtonContainer>
                  <ActionButtonContainer>
                    <Tooltip title="Añadir nueva lista" TransitionComponent={Zoom} arrow>
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
                        size={isMobile ? "small" : "medium"}
                        sx={{ 
                          borderRadius: '8px',
                          boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)'
                        }}
                      >
                        {isMobile ? 'Nuevo' : 'Nueva Lista'}
                      </Button>
                    </Tooltip>
                  </ActionButtonContainer>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </motion.div>
        
        {/* Contenido principal con animación */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Paper 
            elevation={3} 
            sx={{ 
              width: '100%', 
              overflow: 'hidden',
              borderRadius: '12px',
              background: theme.palette.background.paper
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                >
                  <CircularProgress color="primary" />
                </motion.div>
              </Box>
            ) : (
              <>
                {/* Vista condicional: tarjetas o tabla */}
                <Box sx={{ p: viewMode === 'card' ? 2 : 0 }}>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={viewMode}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {viewMode === 'card' ? renderCardView() : renderTableView()}
                    </motion.div>
                  </AnimatePresence>
                </Box>
                
                {/* Paginación con animación */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <Divider />
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={totalItems}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage={isMobile ? 'Filas:' : 'Filas por página:'}
                  />
                </motion.div>
              </>
            )}
          </Paper>
        </motion.div>
        
        {/* Diálogo animado para agregar/editar */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="sm" 
          fullWidth
          TransitionComponent={Fade}
          transitionDuration={400}
        >
          <DialogTitle sx={{ 
            background: theme.palette.primary.main, 
            color: 'white',
            fontSize: '1.2rem' 
          }}>
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
                transition={{ duration: 0.3, delay: 0.2 }}
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