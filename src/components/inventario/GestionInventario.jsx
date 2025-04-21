import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Box, Paper, 
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, 
  TablePagination, TextField, Chip, InputAdornment
} from '@mui/material';
import { toast } from 'react-toastify';
import { Delete, Edit, AddShoppingCart, Inventory, Clear, Search, ArrowUpward, ArrowDownward, Input as InputIcon, PointOfSale, Lock, LockOpen } from '@mui/icons-material';
import AgregarProducto from '../AgregarProducto';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import HistorialEntradas from './HistorialEntradas';
import HistorialSalidas from './HistorialSalidas';
import { debounce } from 'lodash';
import { styled } from '@mui/material/styles';
import moment from 'moment-timezone';
import axios from 'axios';
import TasaCambio from '../TasaCambio';
import { VpnKey } from '@mui/icons-material';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

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

const transformarProducto = (producto) => {
  const parseNumber = (value) => {
    if (typeof value === "object" && value?.$numberInt) {
      return parseInt(value.$numberInt, 10);
    }
    return Number(value) || 0;
  };

  const parseDate = (value) => {
    if (typeof value === "object" && value?.$date?.$numberLong) {
      return new Date(parseInt(value.$date.$numberLong, 10));
    }
    return new Date(value);
  };

  return {
    id: producto._id?.$oid || producto._id.toString(),
    nombre: producto.nombre,
    codigo: producto.codigo,
    proveedor: producto.proveedor,
    costoInicial: parseNumber(producto.costoInicial),
    acarreo: parseNumber(producto.acarreo),
    flete: parseNumber(producto.flete),
    cantidad: parseNumber(producto.cantidad),
    costoFinal: parseNumber(producto.costoFinal),
    stock: parseNumber(producto.stock),
    fecha: parseDate(producto.fecha),
    fechaIngreso: moment(producto.fechaIngreso).toDate()
  };
};

const GestionInventario = () => {
  const [productos, setProductos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState([]);
  const [entradaStock, setEntradaStock] = useState({
    productoId: null,
    cantidad: '',
    proveedor: '',
    fechaHora: new Date().toLocaleString()
  });
  const [modalEntradaAbierto, setModalEntradaAbierto] = useState(false);
  const [pinDialogAbierto, setPinDialogAbierto] = useState(false);
  const [pin, setPin] = useState('');
  const [camposDesbloqueados, setCamposDesbloqueados] = useState(false);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'nombre', direction: 'asc' });

  // PIN válido (puedes cambiarlo o obtenerlo desde el backend)
  const PIN_VALIDO = '1234';

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const response = await axios.get(`${API_URL}/productos`);
        const productosTransformados = response.data.productos.map(transformarProducto);
        setProductos(productosTransformados);
      } catch (error) {
        console.error("Error al cargar productos:", error);
        toast.error("Error cargando productos");
      }
    };
    cargarProductos();
  }, []);

  const abrirEditar = (producto) => {
    setProductoEditando({ ...producto, fechaIngreso: new Date().toLocaleString() });
    setMostrarFormulario(true);
  };

  const eliminarProducto = async (id) => {
    const confirmar = window.confirm('¿Estás seguro de eliminar este producto?');
    if (confirmar) {
      try {
        await axios.delete(`${API_URL}/productos/${id}`);
        const productosActualizados = productos.filter(p => p.id !== id);
        setProductos(productosActualizados);
        toast.success('Producto eliminado correctamente');
      } catch (error) {
        console.error('Error al eliminar el producto:', error);
        toast.error('Error al eliminar el producto');
      }
    }
  };

  const handleProductoGuardado = (nuevoProducto) => {
    // Transformar el producto recibido
    const productoTransformado = transformarProducto(nuevoProducto);
    
    // Actualizar el estado de productos sin hacer un segundo POST
    setProductos(prev => [...prev, productoTransformado]);
    
    // Mostrar mensaje de éxito
    toast.success('Producto agregado correctamente');
  };

  const actualizarProducto = async (productoActualizado) => {
    try {
      const response = await axios.put(`${API_URL}/productos/${productoActualizado.id}`, productoActualizado);
      const productoTransformado = transformarProducto(response.data);
      const nuevosProductos = productos.map(p => 
        p.id === productoTransformado.id ? productoTransformado : p
      );
      setProductos(nuevosProductos);
      toast.success(`Producto ${productoTransformado.codigo} actualizado correctamente`);
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      toast.error('Error al actualizar el producto');
    }
  };

  const abrirEntradaStock = (producto) => {
    setEntradaStock({
      productoId: producto.id,
      cantidad: '',
      proveedor: producto.proveedor,
      fechaHora: moment().format('YYYY-MM-DD')
    });
    setModalEntradaAbierto(true);
  };

  const agregarStock = async () => {
    try {
      const productoActual = productos.find(p => p.id === entradaStock.productoId);
      const cantidadIngresada = Number(entradaStock.cantidad);
      
      // Usar el endpoint específico para entradas de stock
      const response = await axios.post(
        `${API_URL}/productos/${productoActual.id}/entradas`,
        {
          cantidad: cantidadIngresada,
          fechaHora: entradaStock.fechaHora
        }
      );

      // Actualizar la lista de productos
      const nuevosProductos = productos.map(p => 
        p.id === productoActual.id ? response.data : p
      );
      setProductos(nuevosProductos);
      
      toast.success(`Stock actualizado: ${productoActual.nombre}`);
      setModalEntradaAbierto(false);
    } catch (error) {
      console.error('Error al actualizar stock:', error);
      toast.error('Error al actualizar stock');
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSearch = useCallback(() => {
    const resultados = productos.filter(item =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredData(resultados);
  }, [productos, searchTerm]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedData = [...filteredData].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
    if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const currentItems = sortedData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  // Manejar el envío del PIN
  const handlePinSubmit = () => {
    if (pin === PIN_VALIDO) {
      setCamposDesbloqueados(true);
      setPinDialogAbierto(false);
      toast.success('Campos desbloqueados');
    } else {
      toast.error('PIN incorrecto');
    }
    setPin('');
  };

  const transitionStyles = {
    transition: 'all 0.3s ease-in-out',
    overflow: 'hidden'
  };

  const botonDesbloqueoStyles = {
    backgroundColor: camposDesbloqueados ? '#4caf50' : '#f44336',
    color: 'white',
    '&:hover': {
      backgroundColor: camposDesbloqueados ? '#45a049' : '#d32f2f'
    }
  };

  const ColumnasSensibles = () => (
    <>
      <StyledTableCell align="right" sx={transitionStyles}>
        Costo Inicial ($)
      </StyledTableCell>
      {/* ... otras columnas ... */}
    </>
  );

  const CeldasSensibles = ({ producto }) => (
    <>
      <StyledTableCell align="right" sx={transitionStyles}>
        ${producto.costoInicial.toFixed(2)}
      </StyledTableCell>
      {/* ... otras celdas ... */}
    </>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
        startIcon={<DashboardIcon />}
      >
        Regresar al Dashboard
      </Button>

      <TasaCambio />

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
              '& .MuiTabs-indicator': { backgroundColor: 'primary.main', height: 3 },
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

        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            variant="outlined"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search />,
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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            onClick={() => setPinDialogAbierto(true)}
            sx={botonDesbloqueoStyles}
            startIcon={camposDesbloqueados ? <LockOpen /> : <Lock />}
          >
            {camposDesbloqueados ? 'Campos Desbloqueados' : 'Desbloquear Campos'}
          </Button>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <TableContainer component={Paper} elevation={0}>
            <StyledTable>
              <TableHead>
                <TableRow>
                  <StyledTableCell onClick={() => handleSort('nombre')}>
                    Producto {sortConfig.key === 'nombre' && (sortConfig.direction === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />)}
                  </StyledTableCell>
                  <StyledTableCell align="right">Código</StyledTableCell>
                  <StyledTableCell align="right">Proveedor</StyledTableCell>
                  {camposDesbloqueados && (
                    <>
                      <StyledTableCell align="right">Costo Inicial ($)</StyledTableCell>
                      <StyledTableCell align="right">Acarreo ($)</StyledTableCell>
                      <StyledTableCell align="right">Flete ($)</StyledTableCell>
                    </>
                  )}
                  <StyledTableCell align="right">Cantidad</StyledTableCell>
                  {camposDesbloqueados && (
                    <StyledTableCell align="right">Costo Final ($)</StyledTableCell>
                  )}
                  <StyledTableCell align="right">Stock</StyledTableCell>
                  <StyledTableCell align="right">Fecha Registro</StyledTableCell>
                  <StyledTableCell align="center">Acciones</StyledTableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {productos.map((producto) => (
                  <StyledTableRow key={producto.id}>
                    <StyledTableCell>{producto.nombre}</StyledTableCell>
                    <StyledTableCell align="right">{producto.codigo}</StyledTableCell>
                    <StyledTableCell align="right">{producto.proveedor}</StyledTableCell>
                    {camposDesbloqueados && (
                      <>
                        <StyledTableCell align="right">
                          <CeldasSensibles producto={producto} />
                        </StyledTableCell>
                        <StyledTableCell align="right">${producto.acarreo.toFixed(2)}</StyledTableCell>
                        <StyledTableCell align="right">${producto.flete.toFixed(2)}</StyledTableCell>
                      </>
                    )}
                    <StyledTableCell align="right">{producto.cantidad}</StyledTableCell>
                    {camposDesbloqueados && (
                      <StyledTableCell align="right">${producto.costoFinal.toFixed(2)}</StyledTableCell>
                    )}
                    <StyledTableCell align="right">
                      <Chip 
                        label={producto.stock} 
                        color={producto.stock > 5 ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontWeight: 'bold' }}
                      />
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      {moment(producto.fechaIngreso).tz('America/Caracas').format('DD/MM/YYYY')}
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
          <HistorialEntradas productos={productos} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <HistorialSalidas productos={productos} />
        </TabPanel>
      </Paper>

      <AgregarProducto
        open={mostrarFormulario}
        onClose={() => {
          setMostrarFormulario(false);
          setProductoEditando(null);
        }}
        productoEditando={productoEditando}
        onProductoGuardado={productoEditando ? actualizarProducto : handleProductoGuardado}
      />

      <Dialog open={modalEntradaAbierto} onClose={() => setModalEntradaAbierto(false)}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Agregar Stock</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Fecha de Ingreso"
            type="date"
            value={entradaStock.fechaHora}
            onChange={(e) => setEntradaStock({ ...entradaStock, fechaHora: e.target.value })}
            InputLabelProps={{ shrink: true }}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Cantidad"
            type="number"
            value={entradaStock.cantidad}
            onChange={(e) => setEntradaStock({ ...entradaStock, cantidad: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Proveedor"
            value={entradaStock.proveedor}
            onChange={(e) => setEntradaStock({ ...entradaStock, proveedor: e.target.value })}
            margin="normal"
          />
        </DialogContent>
        <DialogActions sx={{ padding: 3 }}>
          <Button variant="contained" color="secondary" onClick={() => setModalEntradaAbierto(false)}>
            Cancelar
          </Button>
          <Button variant="contained" color="primary" onClick={agregarStock}>
            Confirmar Entrada
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={pinDialogAbierto} onClose={() => setPinDialogAbierto(false)}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          <Lock fontSize="small" sx={{ mr: 1 }} />
          Desbloquear Campos Sensibles
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <TextField
            autoFocus
            fullWidth
            label="PIN de seguridad"
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" disabled>
                    <VpnKey />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setPinDialogAbierto(false)}
            sx={{ mr: 1 }}
          >
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handlePinSubmit}
            color="primary"
            startIcon={<LockOpen />}
          >
            Desbloquear
          </Button>
        </DialogActions>
      </Dialog>

      <ToastContainer />
    </Container>
  );
};

export default GestionInventario;
