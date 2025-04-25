import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, InputAdornment, IconButton, Chip,
  Alert, CircularProgress, Divider, Tooltip, useTheme, FormControlLabel, Checkbox,
  FormGroup, FormLabel, FormControl
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Percent as PercentIcon,
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  LocalOffer as PriceIcon,
  PriceChange as PriceChangeIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { debounce } from 'lodash';

// URL de la API
const API_URL = "https://suministros-backend.vercel.app/api";

// Componentes estilizados para la tabla
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.3s ease',
  }
}));

const ListaPrecios = () => {
  const theme = useTheme();
  
  // Estados para datos y UI
  const [listasPrecios, setListasPrecios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para modales
  const [openFormulario, setOpenFormulario] = useState(false);
  const [openModalAjuste, setOpenModalAjuste] = useState(false);
  const [listaSeleccionada, setListaSeleccionada] = useState(null);
  
  // Estados para formularios
  const [formData, setFormData] = useState({
    producto: '',
    precio1: 0,
    precio2: 0,
    precio3: 0,
    precioMayorista: 0,
    descripcion: ''
  });
  
  // Estados para ajuste masivo
  const [porcentajeAjuste, setPorcentajeAjuste] = useState(0);
  const [tiposPrecioSeleccionados, setTiposPrecioSeleccionados] = useState({
    precio1: true,
    precio2: true,
    precio3: true,
    precioMayorista: true
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarListasPrecios();
    cargarProductos();
  }, []);
  
  // Función para cargar listas de precios
  const cargarListasPrecios = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/listaprecios`);
      const data = response.data.listasPrecios || response.data || [];
      setListasPrecios(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar listas de precios:', error);
      toast.error('Error al cargar las listas de precios');
      setListasPrecios([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar productos
  const cargarProductos = async () => {
    try {
      const response = await axios.get(`${API_URL}/productos`);
      const data = response.data || [];
      setProductos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar los productos');
      setProductos([]);
    }
  };
  
  // Función para manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.startsWith('precio') ? parseFloat(value) || 0 : value
    });
  };
  
  // Función para abrir formulario de nuevo precio
  const abrirNuevo = () => {
    setListaSeleccionada(null);
    setFormData({
      producto: '',
      precio1: 0,
      precio2: 0,
      precio3: 0,
      precioMayorista: 0,
      descripcion: ''
    });
    setOpenFormulario(true);
  };
  
  // Función para abrir formulario de edición
  const abrirEditar = (lista) => {
    setListaSeleccionada(lista);
    setFormData({
      producto: lista.producto._id || lista.producto,
      precio1: lista.precio1,
      precio2: lista.precio2,
      precio3: lista.precio3,
      precioMayorista: lista.precioMayorista,
      descripcion: lista.descripcion || ''
    });
    setOpenFormulario(true);
  };
  
  // Función para cerrar formulario
  const cerrarFormulario = () => {
    setOpenFormulario(false);
    setListaSeleccionada(null);
  };
  
  // Función para eliminar precio
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este precio?')) return;
    
    try {
      setIsLoading(true);
      await axios.delete(`${API_URL}/listaprecios/${id}`);
      toast.success('Precio eliminado correctamente');
      cargarListasPrecios();
    } catch (error) {
      console.error('Error al eliminar precio:', error);
      toast.error('Error al eliminar el precio');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para enviar formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.producto || formData.precio1 <= 0) {
      toast.error('Por favor completa los campos requeridos');
      return;
    }
    
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/listaprecios`, formData);
      
      toast.success(listaSeleccionada ? 'Precio actualizado correctamente' : 'Precio creado correctamente');
      cerrarFormulario();
      cargarListasPrecios();
    } catch (error) {
      console.error('Error al guardar precio:', error);
      toast.error('Error al guardar el precio');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para ajuste masivo de precios
  const handleAjusteMasivo = async () => {
    try {
      if (isNaN(porcentajeAjuste) || porcentajeAjuste === 0) {
        toast.error('Ingrese un porcentaje válido');
        return;
      }
      
      const tiposPrecio = Object.entries(tiposPrecioSeleccionados)
        .filter(([_, selected]) => selected)
        .map(([tipo]) => tipo);
      
      if (tiposPrecio.length === 0) {
        toast.error('Seleccione al menos un tipo de precio');
        return;
      }
      
      setIsLoading(true);
      await axios.post(`${API_URL}/listaprecios/actualizar-masivo`, {
        porcentaje: porcentajeAjuste,
        tiposPrecio
      });
      
      toast.success(`Precios actualizados con un ${porcentajeAjuste}% de ajuste`);
      setOpenModalAjuste(false);
      setPorcentajeAjuste(0);
      cargarListasPrecios();
    } catch (error) {
      console.error('Error al ajustar precios:', error);
      toast.error('Error al ajustar los precios');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para manejar cambios en tipos de precio seleccionados
  const handleTiposPrecioChange = (e) => {
    const { name, checked } = e.target;
    setTiposPrecioSeleccionados({
      ...tiposPrecioSeleccionados,
      [name]: checked
    });
  };
  
  // Función para filtrar listas de precios
  const filtrarListasPrecios = () => {
    if (!filtro) return listasPrecios;
    
    return listasPrecios.filter(item => 
      item.nombreProducto?.toLowerCase().includes(filtro.toLowerCase()) ||
      item.codigoProducto?.toLowerCase().includes(filtro.toLowerCase())
    );
  };
  
  // Función para manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Función para manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Aplicar filtro y paginación
  const listasFiltradas = filtrarListasPrecios();
  const listasVisible = listasFiltradas.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Función para formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(valor);
  };
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom color="primary">
        Gestión de Precios
      </Typography>
      
      {/* Barra de herramientas */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <TextField
          label="Buscar"
          variant="outlined"
          size="small"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ width: 300 }}
        />
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={cargarListasPrecios}
            sx={{ mr: 1 }}
          >
            Actualizar
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<PriceChangeIcon />}
            onClick={() => setOpenModalAjuste(true)}
            sx={{ mr: 1 }}
          >
            Ajuste Masivo
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<AddIcon />}
            onClick={abrirNuevo}
          >
            Nuevo Precio
          </Button>
        </Box>
      </Box>
      
      {/* Tabla de listas de precios */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.primary.main, color: 'white' }}>Código</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.primary.main, color: 'white' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.primary.main, color: 'white' }}>Precio 1</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.primary.main, color: 'white' }}>Precio 2</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.primary.main, color: 'white' }}>Precio 3</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.primary.main, color: 'white' }}>Mayorista</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: theme.palette.primary.main, color: 'white' }}>Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listasVisible.map((lista) => (
                    <TableRow hover key={lista._id}>
                      <TableCell>{lista.codigoProducto}</TableCell>
                      <TableCell>{lista.nombreProducto}</TableCell>
                      <TableCell>$ {formatearMoneda(lista.precio1)}</TableCell>
                      <TableCell>$ {formatearMoneda(lista.precio2)}</TableCell>
                      <TableCell>$ {formatearMoneda(lista.precio3)}</TableCell>
                      <TableCell>$ {formatearMoneda(lista.precioMayorista)}</TableCell>
                      <TableCell>
                        <IconButton 
                          color="primary" 
                          onClick={() => abrirEditar(lista)}
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
                  ))}
                  {listasVisible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
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
              count={listasFiltradas.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
      
      {/* Modal para crear/editar precios */}
      <Dialog 
        open={openFormulario} 
        onClose={cerrarFormulario}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          {listaSeleccionada ? 'Editar Precio' : 'Nuevo Precio'}
        </DialogTitle>
        
        <DialogContent dividers>
          <Box component="form" onSubmit={handleSubmit} sx={{ pt: 1 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label="Producto"
                  name="producto"
                  value={formData.producto}
                  onChange={handleChange}
                  disabled={!!listaSeleccionada}
                  required
                  variant="outlined"
                  margin="normal"
                >
                  <MenuItem value="">Seleccione un producto</MenuItem>
                  {productos.map(p => (
                    <MenuItem key={p._id} value={p._id}>
                      {p.nombre} - {p.codigo}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Precio 1"
                  name="precio1"
                  type="number"
                  value={formData.precio1}
                  onChange={handleChange}
                  required
                  inputProps={{ step: "0.01", min: "0" }}
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Precio 2"
                  name="precio2"
                  type="number"
                  value={formData.precio2}
                  onChange={handleChange}
                  inputProps={{ step: "0.01", min: "0" }}
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Precio 3"
                  name="precio3"
                  type="number"
                  value={formData.precio3}
                  onChange={handleChange}
                  inputProps={{ step: "0.01", min: "0" }}
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Precio Mayorista"
                  name="precioMayorista"
                  type="number"
                  value={formData.precioMayorista}
                  onChange={handleChange}
                  inputProps={{ step: "0.01", min: "0" }}
                  variant="outlined"
                  margin="normal"
                  InputProps={{
                    startAdornment: <InputAdornment position="start">Bs.</InputAdornment>,
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Descripción"
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  multiline
                  rows={3}
                  variant="outlined"
                  margin="normal"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={cerrarFormulario} color="inherit">
            Cancelar
          </Button>
          <Button 
            type="submit"
            variant="contained" 
            color="primary"
            onClick={handleSubmit}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Guardando...' : 'Guardar'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal para ajuste masivo */}
      <Dialog 
        open={openModalAjuste} 
        onClose={() => setOpenModalAjuste(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: 'secondary.main', color: 'white' }}>
          Ajuste Masivo de Precios
        </DialogTitle>
        
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Porcentaje de Ajuste (%)"
              type="number"
              value={porcentajeAjuste}
              onChange={(e) => setPorcentajeAjuste(parseFloat(e.target.value))}
              inputProps={{ step: "0.01" }}
              variant="outlined"
              margin="normal"
              required
              helperText="Valor positivo para aumento, negativo para descuento"
            />
            
            <FormControl component="fieldset" sx={{ mt: 3 }}>
              <FormLabel component="legend">Aplicar a:</FormLabel>
              <FormGroup row>
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={tiposPrecioSeleccionados.precio1}
                      onChange={handleTiposPrecioChange}
                      name="precio1"
                    />
                  }
                  label="Precio 1"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={tiposPrecioSeleccionados.precio2}
                      onChange={handleTiposPrecioChange}
                      name="precio2"
                    />
                  }
                  label="Precio 2"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={tiposPrecioSeleccionados.precio3}
                      onChange={handleTiposPrecioChange}
                      name="precio3"
                    />
                  }
                  label="Precio 3"
                />
                <FormControlLabel
                  control={
                    <Checkbox 
                      checked={tiposPrecioSeleccionados.precioMayorista}
                      onChange={handleTiposPrecioChange}
                      name="precioMayorista"
                    />
                  }
                  label="Precio Mayorista"
                />
              </FormGroup>
            </FormControl>
          </Box>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenModalAjuste(false)} color="inherit">
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            color="secondary"
            onClick={handleAjusteMasivo}
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} /> : <PercentIcon />}
          >
            {isLoading ? 'Aplicando...' : 'Aplicar Ajuste'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* ToastContainer para notificaciones */}
      <ToastContainer position="bottom-right" />
    </Container>
  );
};

export default ListaPrecios; 