import React, { useState, useEffect, useContext, useCallback } from 'react';
import { 
  Container, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Box, Grid, 
  TextField, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, InputAdornment, TablePagination
} from '@mui/material';
import { toast } from 'react-toastify';
import { Delete, Edit, AddShoppingCart, Inventory, AttachMoney, Clear, Add, Search, ArrowUpward, ArrowDownward, Input as InputIcon, PointOfSale } from '@mui/icons-material';
import AgregarProducto from '../AgregarProducto';
import { TasaCambioContext } from '../../context/TasaCambioContext';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HistorialEntradas from './HistorialEntradas';
import HistorialSalidas from './HistorialSalidas';
import { debounce } from 'lodash';
import { styled } from '@mui/material/styles';

// Estilos unificados para la tabla
const StyledTable = styled(Table)(({ theme }) => ({
  '& .MuiTableCell-root': {
    borderColor: theme.palette.divider,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.3s ease',
  },
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 500,
  color: theme.palette.text.primary,
  fontSize: '0.875rem',
  '&.MuiTableCell-head': {
    fontWeight: 'bold',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontSize: '1rem',
  },
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`inventario-tabpanel-${index}`}
      aria-labelledby={`inventario-tab-${index}`}
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

const GestionInventario = () => {
  const { tasaPromedio, setTasaPromedio } = useContext(TasaCambioContext);
  const [productos, setProductos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null); 
  const [precioLegal, setPrecioLegal] = useState(68.13);
  const [precioInformal, setPrecioInformal] = useState(86.25);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [entradaStock, setEntradaStock] = useState({
    productoId: null,
    cantidad: '',
    proveedor: '',
    fechaHora: new Date().toLocaleString()
  });
  const [modalEntradaAbierto, setModalEntradaAbierto] = useState(false);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });

  useEffect(() => {
    const cargarProductos = () => {
      const guardados = JSON.parse(localStorage.getItem('productos')) || [];
      const productosFormateados = guardados.map(p => ({
        id: p.id,
        nombre: p.nombre || 'Sin nombre',
        codigo: p.codigo || '0000',
        categoria: p.categoria || 'Sin categoría',
        precio: Number(p.precio) || 0,
        stock: Number (p.stock) || 0,
        costoFinal: Number(p.costoFinal) || 0,
        fechaIngreso: p.fechaIngreso || new Date().toLocaleString()
      }));
      setProductos(productosFormateados);
    };
    cargarProductos();
  }, []);

  useEffect(() => {
    // Usamos directamente la tasa informal para los cálculos
    setTasaPromedio(precioInformal.toFixed(3));
  }, [precioInformal, setTasaPromedio]);

  const abrirEditar = (producto) => {
    setProductoEditando({ ...producto, fechaIngreso: new Date().toLocaleString() });
    setMostrarFormulario(true);
  };

  const eliminarProducto = (id) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar este producto?');
    if (confirmar) {
      const productosActualizados = productos.filter(p => p.id !== id);
      localStorage.setItem('productos', JSON.stringify(productosActualizados));
      setProductos(productosActualizados);
      toast.success('Producto eliminado correctamente');
    }
  };

  // Modificada para usar solo la tasa informal
  const mostrarPrecioBs = (producto) => {
    // Si el producto tiene un precioFinalBs registrado, usarlo
    if (producto.precioFinalBs) {
      return producto.precioFinalBs;
    }
    // Si no, calcular con la tasa informal
    return (producto.precio * precioInformal).toFixed(2);
  };

  // Ordenar productos por fecha de ingreso (más reciente primero)
  const productosOrdenados = [...productos].sort((a, b) => {
    return new Date(b.fechaIngreso) - new Date(a.fechaIngreso);
  });

  // Filtrar productos por código
  const productosFiltrados = productosOrdenados.filter(producto =>
    producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProductoGuardado = (nuevoProducto) => {
    const nuevosProductos = [...productos, nuevoProducto];
    setProductos(nuevosProductos);
    localStorage.setItem('productos', JSON.stringify(nuevosProductos));
    toast.success('Producto agregado correctamente');
  };

  const actualizarProducto = (productoActualizado) => {
    const productoAnterior = productos.find(p => p.id === productoActualizado.id);
    
    const nuevosProductos = productos.map(p => {
      if (p.id === productoActualizado.id) {
        const cambio = {
          tipo: 'actualizacion',
          id: productoActualizado.id,
          nombre: productoActualizado.nombre,
          codigo: productoActualizado.codigo,
          costoFinal: productoActualizado.costoFinal,
          precio: productoActualizado.precio,
          gananciaTotal: productoActualizado.gananciaTotal,
          gananciaUnitaria: productoActualizado.gananciaUnitaria,
          stockAnterior: productoAnterior.stock,
          stockNuevo: productoActualizado.stock,
          fecha: new Date().toLocaleString()
        };
        
        const historialEntradas = JSON.parse(localStorage.getItem('historialEntradas')) || [];
        localStorage.setItem('historialEntradas', JSON.stringify([cambio, ...historialEntradas]));

        return { ...productoActualizado };
      }
      return p;
    });

    setProductos(nuevosProductos);
    localStorage.setItem('productos', JSON.stringify(nuevosProductos));
    toast.success(`Producto ${productoActualizado.codigo} actualizado correctamente`);
  };

  const abrirEntradaStock = (producto) => {
    setEntradaStock({
      productoId: producto.id,
      cantidad: '',
      proveedor: producto.proveedor, // Proveedor por defecto
      fechaHora: new Date().toLocaleString()
    });
    setModalEntradaAbierto(true);
  };

  const cerrarEntradaStock = () => {
    setModalEntradaAbierto(false);
  };

  const agregarStock = () => {
    const productoActual = productos.find(p => p.id === entradaStock.productoId);
    
    const nuevosProductos = productos.map(producto => {
      if (producto.id === entradaStock.productoId) {
        const nuevaEntrada = {
          tipo: 'entrada_stock',
          id: producto.id,
          nombre: producto.nombre,
          codigo: producto.codigo,
          cantidad: Number(entradaStock.cantidad),
          stockAnterior: producto.stock,
          stockNuevo: producto.stock + Number(entradaStock.cantidad),
          costoFinal: producto.costoFinal,
          precio: producto.precio,
          gananciaTotal: producto.gananciaTotal,
          gananciaUnitaria: producto.gananciaUnitaria,
          proveedor: entradaStock.proveedor,
          fecha: new Date().toLocaleString()
        };
        
        const historialEntradas = JSON.parse(localStorage.getItem('historialEntradas')) || [];
        localStorage.setItem('historialEntradas', JSON.stringify([nuevaEntrada, ...historialEntradas]));

        return {
          ...producto,
          stock: producto.stock + Number(entradaStock.cantidad),
          proveedor: entradaStock.proveedor
        };
      }
      return producto;
    });

    setProductos(nuevosProductos);
    localStorage.setItem('productos', JSON.stringify(nuevosProductos));
    cerrarEntradaStock();
    toast.success(`Stock actualizado correctamente: +${entradaStock.cantidad} unidades`);
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  // Búsqueda con debounce
  const handleSearch = useCallback(debounce((term) => {
    const resultados = productos.filter(item =>
      item.nombre.toLowerCase().includes(term.toLowerCase()) ||
      item.codigo.toLowerCase().includes(term.toLowerCase())
    );
    setFilteredData(resultados);
  }, 300), [productos]);

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm, handleSearch]);

  // Ordenamiento
  const sortedData = [...filteredData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Paginación
  const currentItems = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleEntradaStock = (e, productoId) => {
    const cantidadEntrada = parseFloat(e.target.value) || 0;
    
    if (isNaN(cantidadEntrada) || cantidadEntrada <= 0) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    const productosActualizados = productos.map(producto => {
      if (producto.id === productoId) {
        const stockActual = parseFloat(producto.stock) || 0;
        const nuevoStock = stockActual + cantidadEntrada;
        return { ...producto, stock: nuevoStock };
      }
      return producto;
    });

    setProductos(productosActualizados);
    localStorage.setItem('productos', JSON.stringify(productosActualizados));
    toast.success(`Se agregaron ${cantidadEntrada} unidades al stock`);

    // Resetear el valor del campo de entrada
    e.target.value = '';
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Botón para regresar al dashboard */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
        startIcon={<DashboardIcon />}
      >
        Regresar al Dashboard
      </Button>

      {/* Sección Principal */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h4" sx={{
            color: 'primary.main',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <Inventory fontSize="large" /> Gestión de Inventario
          </Typography>

          <Tabs 
            value={tabValue} 
            onChange={handleChangeTab}
            sx={{
              '& .MuiTabs-indicator': {
                backgroundColor: 'primary.main',
                height: 3,
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 'bold',
                color: 'text.secondary',
                '&.Mui-selected': { color: 'primary.main' }
              }
            }}
          >
            <Tab label="Inventario Actual" />
            <Tab label="Historial de Entradas" />
            <Tab label="Historial de Salidas" />
          </Tabs>
        </Box>

        {/* Sección de Tasas de Cambio - Mantenemos los campos pero solo usamos informal */}
        <Paper elevation={1} sx={{ p: 2, mb: 4, backgroundColor: 'white' }}>
          <Typography variant="h5" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoney /> Tasas de Cambio
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Precio Legal ($ a Bs)"
                type="number"
                value={precioLegal}
                onChange={(e) => setPrecioLegal(parseFloat(e.target.value))}
                fullWidth
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>1$ =</Typography>,
                  endAdornment: <Typography sx={{ ml: 1 }}>Bs</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Precio Informal ($ a Bs) - Tasa en Uso"
                type="number"
                value={precioInformal}
                onChange={(e) => setPrecioInformal(parseFloat(e.target.value))}
                fullWidth
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>1$ =</Typography>,
                  endAdornment: <Typography sx={{ ml: 1 }}>Bs</Typography>,
                }}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField
                label="Tasa en Uso ($ a Bs)"
                type="number"
                value={precioInformal}  // Mostramos la tasa informal como tasa en uso
                disabled
                fullWidth
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1 }}>1$ =</Typography>,
                  endAdornment: <Typography sx={{ ml: 1 }}>Bs</Typography>,
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Resto del componente permanece igual... */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              setMostrarFormulario(true);
              setProductoEditando(null);
            }}
            startIcon={<AddShoppingCart />}
            sx={{ 
              borderRadius: '8px', 
              textTransform: 'none', 
              fontSize: '1rem',
              px: 3,
              py: 1.5,
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
              }
            }}
          >
            Agregar Producto
          </Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={() => navigate('/ventas/procesar')}
            startIcon={<PointOfSale />}
            sx={{ 
              borderRadius: '8px', 
              textTransform: 'none', 
              fontSize: '1rem',
              px: 3,
              py: 1.5,
              boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
              '&:hover': {
                boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
              }
            }}
          >
            Vender Producto
          </Button>
        </Box>

        {/* Campo de búsqueda por código */}
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            variant="outlined"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <IconButton onClick={() => setSearchTerm('')} size="small">
                  <Clear />
                </IconButton>
              ),
              sx: { borderRadius: '25px' }
            }}
            sx={{ flexGrow: 1 }}
          />
        </Box>

        {/* Lista de Productos */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper} elevation={0}>
            <StyledTable>
              <TableHead>
                <TableRow>
                  <StyledTableCell onClick={() => setSortConfig({ key: 'nombre', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>
                    Producto {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                  </StyledTableCell>
                  <StyledTableCell align="right">Código</StyledTableCell>
                  <StyledTableCell align="right">Precio ($)</StyledTableCell>
                  <StyledTableCell align="right">Costo Final ($)</StyledTableCell>
                  <StyledTableCell align="right">Stock</StyledTableCell>
                  <StyledTableCell>Categoría</StyledTableCell>
                  <StyledTableCell align="right">Fecha Registro</StyledTableCell>
                  <StyledTableCell align="center">Acciones</StyledTableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {currentItems.map((producto) => (
                  <StyledTableRow key={producto.id}>
                    <StyledTableCell>{producto.nombre}</StyledTableCell>
                    <StyledTableCell align="right">{producto.codigo}</StyledTableCell>
                    <StyledTableCell align="right">
                      ${(Number(producto.precio) || 0).toFixed(2)}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      ${(Number(producto.costoFinal) || 0).toFixed(2)}
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Chip 
                        label={producto.stock} 
                        color={producto.stock > 5 ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </StyledTableCell>
                    <StyledTableCell>{producto.categoria}</StyledTableCell>
                    <StyledTableCell align="right">
                      {producto.fechaIngreso}
                    </StyledTableCell>
                    <StyledTableCell align="center">
                      <IconButton onClick={() => abrirEntradaStock(producto)}>
                        <InputIcon color="primary" />
                      </IconButton>
                      <IconButton onClick={() => abrirEditar(producto)}>
                        <Edit color="primary" />
                      </IconButton>
                      <IconButton onClick={() => eliminarProducto(producto.id)}>
                        <Delete color="error" />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </StyledTable>
          </TableContainer>

          {/* Paginación */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={sortedData.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <HistorialEntradas 
            productos={productos}
            tasa={tasaPromedio}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <HistorialSalidas 
            productos={productos}
            tasa={tasaPromedio}
          />
        </TabPanel>
      </Paper>

      {/* Modal para agregar/editar producto */}
      <AgregarProducto
        open={mostrarFormulario}
        onClose={() => {
          setMostrarFormulario(false);
          setProductoEditando(null);
        }}
        productoEditando={productoEditando}
        onProductoGuardado={(producto) => {
          productoEditando 
            ? actualizarProducto(producto)  // Si estamos editando
            : handleProductoGuardado(producto) // Si es nuevo producto
        }}
      />

      {/* Modal para entrada de stock */}
      <Dialog open={modalEntradaAbierto} onClose={cerrarEntradaStock}>
        <DialogTitle>Agregar Stock</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Cantidad"
            type="number"
            value={entradaStock.cantidad}
            onChange={(e) => setEntradaStock({ ...entradaStock, cantidad: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Proveedor"
            value={entradaStock.proveedor}
            onChange={(e) => setEntradaStock({ ...entradaStock, proveedor: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Fecha y Hora"
            value={entradaStock.fechaHora}
            disabled
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={cerrarEntradaStock} color="secondary">
            Cancelar
          </Button>
          <Button onClick={agregarStock} color="primary" variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ToastContainer para mostrar las notificaciones */}
      <ToastContainer />
    </Container>
  );
};

export default GestionInventario;