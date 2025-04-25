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
  LocalOffer as PriceIcon
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
  const [listaPrecios, setListaPrecios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estados para paginación
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Estados para modales
  const [openFormulario, setOpenFormulario] = useState(false);
  const [openModalAjuste, setOpenModalAjuste] = useState(false);
  const [precioEditando, setPrecioEditando] = useState(null);
  
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
  const [ajustePorcentaje, setAjustePorcentaje] = useState(0);
  const [tiposPrecioSeleccionados, setTiposPrecioSeleccionados] = useState({
    precio1: true,
    precio2: true,
    precio3: true,
    precioMayorista: true
  });

  // Cargar datos iniciales
  useEffect(() => {
    cargarListaPrecios();
    cargarProductos();
  }, []);
  
  // Función para cargar lista de precios
  const cargarListaPrecios = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/listaprecios`);
      setListaPrecios(response.data);
    } catch (error) {
      console.error('Error al cargar lista de precios:', error);
      toast.error('Error al cargar la lista de precios');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Función para cargar productos
  const cargarProductos = async () => {
    try {
      const response = await axios.get(`${API_URL}/productos`);
      // Manejar respuesta paginada o directa
      const productosData = response.data.productos || response.data;
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar los productos');
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
    setPrecioEditando(null);
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
  const abrirEditar = (precio) => {
    setPrecioEditando(precio);
    setFormData({
      producto: precio.producto._id || precio.producto,
      precio1: precio.precio1,
      precio2: precio.precio2,
      precio3: precio.precio3,
      precioMayorista: precio.precioMayorista,
      descripcion: precio.descripcion || ''
    });
    setOpenFormulario(true);
  };
  
  // Función para cerrar formulario
  const cerrarFormulario = () => {
    setOpenFormulario(false);
    setPrecioEditando(null);
  };
  
  // Función para eliminar precio
  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar este precio?')) return;
    
    try {
      setIsLoading(true);
      await axios.delete(`${API_URL}/listaprecios/${id}`);
      toast.success('Precio eliminado correctamente');
      cargarListaPrecios();
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
      
      toast.success(precioEditando ? 'Precio actualizado correctamente' : 'Precio creado correctamente');
      cerrarFormulario();
      cargarListaPrecios();
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
      if (isNaN(ajustePorcentaje) || ajustePorcentaje === 0) {
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
        porcentaje: ajustePorcentaje,
        tiposPrecio
      });
      
      toast.success(`Precios actualizados con un ${ajustePorcentaje}% de ajuste`);
      setOpenModalAjuste(false);
      setAjustePorcentaje(0);
      cargarListaPrecios();
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
  
  // Función para filtrar lista de precios
  const filtrarListaPrecios = () => {
    if (!filtro) return listaPrecios;
    
    return listaPrecios.filter(item => 
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
  const listaFiltrada = filtrarListaPrecios();
  const listaVisible = listaFiltrada.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  
  // Función para formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(valor);
  };
  
  return (
    <Container maxWidth="lg">
      <Paper sx={{ p: 3, my: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h1">
            Gestión de Lista de Precios
          </Typography>
          
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={abrirNuevo}
              sx={{ mr: 1 }}
            >
              Nuevo Precio
            </Button>
            
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<PercentIcon />}
              onClick={() => setOpenModalAjuste(true)}
            >
              Ajuste Masivo
            </Button>
          </Box>
        </Box>
        
        <Box mb={3}>
          <TextField
            fullWidth
            variant="outlined"
            label="Buscar por nombre o código"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: filtro && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setFiltro('')} size="small">
                    <DeleteIcon />
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
        </Box>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer component={Paper} elevation={0}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Producto</StyledTableCell>
                    <StyledTableCell>Código</StyledTableCell>
                    <StyledTableCell align="right">Precio 1</StyledTableCell>
                    <StyledTableCell align="right">Precio 2</StyledTableCell>
                    <StyledTableCell align="right">Precio 3</StyledTableCell>
                    <StyledTableCell align="right">Precio Mayorista</StyledTableCell>
                    <StyledTableCell align="center">Acciones</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {listaVisible.map((item) => (
                    <StyledTableRow key={item._id}>
                      <TableCell>{item.nombreProducto}</TableCell>
                      <TableCell>{item.codigoProducto}</TableCell>
                      <TableCell align="right">{formatearMoneda(item.precio1)}</TableCell>
                      <TableCell align="right">{formatearMoneda(item.precio2)}</TableCell>
                      <TableCell align="right">{formatearMoneda(item.precio3)}</TableCell>
                      <TableCell align="right">{formatearMoneda(item.precioMayorista)}</TableCell>
                      <TableCell align="center">
                        <IconButton 
                          color="primary" 
                          size="small" 
                          onClick={() => abrirEditar(item)}
                          title="Editar"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          color="error" 
                          size="small" 
                          onClick={() => handleDelete(item._id)}
                          title="Eliminar"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </StyledTableRow>
                  ))}
                  
                  {listaVisible.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="textSecondary" py={2}>
                          No hay precios para mostrar
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={listaFiltrada.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Filas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
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
          {precioEditando ? 'Editar Precio' : 'Nuevo Precio'}
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
                  disabled={!!precioEditando}
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
              value={ajustePorcentaje}
              onChange={(e) => setAjustePorcentaje(parseFloat(e.target.value))}
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