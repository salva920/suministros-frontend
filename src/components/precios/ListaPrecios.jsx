import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api";
const ListaPrecios = () => {
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
      
      console.log("Datos recibidos:", response.data); // Para debugging
      
      // Usar la estructura de respuesta de mongoose-paginate-v2
      setListasPrecios(response.data.listasPrecios || []);
      setTotalItems(response.data.totalDocs || 0);
      setTotalPages(response.data.totalPages || 0);
      
      toast.success('Listas de precios cargadas correctamente');
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

  // Eliminar lista de precios
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

  // Paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary">
        Gestión de Listas de Precios
      </Typography>
      
      {/* Barra de herramientas */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Buscar"
          variant="outlined"
          size="small"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ width: 300 }}
        />
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={() => cargarListasPrecios()}
            sx={{ mr: 1 }}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            color="secondary"
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
          >
            Nueva Lista
          </Button>
        </Box>
      </Box>
      
      {/* Tabla de listas de precios */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Precio 1</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Precio 2</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Precio 3</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listasPrecios.length > 0 ? (
                    listasPrecios.map((lista) => (
                      <TableRow hover key={lista._id}>
                        <TableCell>{lista.nombreProducto}</TableCell>
                        <TableCell>${lista.precio1?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>${lista.precio2?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>${lista.precio3?.toFixed(2) || '0.00'}</TableCell>
                        <TableCell>
                          <IconButton 
                            color="primary" 
                            onClick={() => {
                              setCurrentItem(lista);
                              setOpenDialog(true);
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            color="error"
                            onClick={() => handleDelete(lista._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay listas de precios disponibles
                      </TableCell>
                    </TableRow>
                  )}
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
            />
          </>
        )}
      </Paper>
      
      {/* Diálogo para agregar/editar lista de precios */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentItem._id ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              margin="dense"
              name="nombreProducto"
              label="Nombre del Producto"
              value={currentItem.nombreProducto || ''}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              margin="dense"
              name="precio1"
              label="Precio 1"
              type="number"
              value={currentItem.precio1 || ''}
              onChange={handleChange}
              InputProps={{ startAdornment: '$' }}
            />
            <TextField
              fullWidth
              margin="dense"
              name="precio2"
              label="Precio 2"
              type="number"
              value={currentItem.precio2 || ''}
              onChange={handleChange}
              InputProps={{ startAdornment: '$' }}
            />
            <TextField
              fullWidth
              margin="dense"
              name="precio3"
              label="Precio 3"
              type="number"
              value={currentItem.precio3 || ''}
              onChange={handleChange}
              InputProps={{ startAdornment: '$' }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
      
      <ToastContainer position="bottom-right" />
    </Container>
  );
};

export default ListaPrecios; 