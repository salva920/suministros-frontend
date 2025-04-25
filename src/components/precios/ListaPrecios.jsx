import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, CircularProgress, Grid, FormControl,
  InputLabel, Select, MenuItem, Paper
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PriceChange as PriceChangeIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api";
// Nombres de los meses en español
const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const ListaPrecios = () => {
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
      console.error('Error al guardar la lista de precios:', error);
      toast.error('Error al guardar la lista de precios');
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

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Listado de Precios
      </Typography>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Buscar"
          variant="outlined"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ width: '300px' }}
        />
        <Box display="flex" alignItems="center">
          <FormControl variant="outlined" sx={{ mr: 2 }}>
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
          <FormControl variant="outlined">
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
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setOpenDialog(true);
            setCurrentItem({ nombreProducto: '', precio1: '', precio2: '', precio3: '' });
          }}
        >
          Agregar
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Nombre del Producto</TableCell>
                <TableCell>Precio 1</TableCell>
                <TableCell>Precio 2</TableCell>
                <TableCell>Precio 3</TableCell>
                <TableCell>Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {listasPrecios.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.nombreProducto}</TableCell>
                  <TableCell>{item.precio1}</TableCell>
                  <TableCell>{item.precio2}</TableCell>
                  <TableCell>{item.precio3}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => {
                      setCurrentItem(item);
                      setOpenDialog(true);
                    }}>
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(item._id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>{currentItem._id ? 'Editar Lista de Precios' : 'Nueva Lista de Precios'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="dense"
            name="nombreProducto"
            label="Nombre del Producto"
            value={currentItem.nombreProducto}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="dense"
            name="precio1"
            label="Precio 1"
            type="number"
            value={currentItem.precio1}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="precio2"
            label="Precio 2"
            type="number"
            value={currentItem.precio2}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="dense"
            name="precio3"
            label="Precio 3"
            type="number"
            value={currentItem.precio3}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleSubmit}>{currentItem._id ? 'Actualizar' : 'Guardar'}</Button>
        </DialogActions>
      </Dialog>

      <ToastContainer position="bottom-right" />
    </Container>
  );
};

export default ListaPrecios; 