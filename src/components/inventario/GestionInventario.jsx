import React, { useState, useEffect, useCallback } from 'react';
import { 
  Container, Typography, Button, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Box, Paper, 
  Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, 
  TablePagination, TextField, Chip, InputAdornment,
  DialogContentText
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
import moment from 'moment';
import 'moment/locale/es';
import axios from 'axios';
import TasaCambio from '../TasaCambio';
import { VpnKey } from '@mui/icons-material';
import { Lock as LockIcon } from '@mui/icons-material';

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
  if (!producto || typeof producto !== 'object') {
    console.warn('Producto inválido:', producto);
    return null;
  }
  
  try {
    // Función para parsear valores numéricos
    const parseNumber = (value) => {
      if (value === undefined || value === null) return 0;
      if (typeof value === 'number') return value;
      return parseFloat(value) || 0;
    };
    
    // Función para parsear fechas manteniendo UTC
    const parseDate = (value) => {
      try {
        if (!value) return new Date();
        
        // Intentar parsear usando moment en UTC
        const momentDate = moment.utc(value);
        if (momentDate.isValid()) {
          // Mantener en UTC para evitar problemas de zona horaria
          return momentDate.toDate();
        }
        
        // Si falló moment, intentar con Date directamente
        const fecha = new Date(value);
        if (!isNaN(fecha.getTime())) return fecha;
        
        // Fallback - fecha actual en UTC
        console.warn('No se pudo parsear la fecha, usando fecha actual:', value);
        return moment.utc().toDate();
      } catch (e) {
        console.error('Error parseando fecha:', e, value);
        return moment.utc().toDate();
      }
    };
    
    // Asegurar que el ID esté presente
    const id = producto._id?.toString() || producto.id?.toString() || '';
    
    // Intentar parsear la fecha de ingreso en UTC
    let fechaIngreso = parseDate(producto.fechaIngreso);
    
    return {
      _id: id,
      id: id,
      nombre: producto.nombre || '',
      codigo: producto.codigo || '',
      proveedor: producto.proveedor || '',
      costoInicial: parseNumber(producto.costoInicial),
      acarreo: parseNumber(producto.acarreo),
      flete: parseNumber(producto.flete),
      cantidad: parseNumber(producto.cantidad),
      costoFinal: parseNumber(producto.costoFinal),
      stock: parseNumber(producto.stock),
      fechaIngreso: fechaIngreso,
    };
  } catch (error) {
    console.error('Error transformando producto:', error, producto);
    return null;
  }
};

const GestionInventario = () => {
  const [productos, setProductos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [productoEditando, setProductoEditando] = useState(null);
  const [entradaStock, setEntradaStock] = useState({
    productoId: null,
    cantidad: '',
    proveedor: '',
    fechaHora: '',
    costoInicial: '',
    acarreo: '',
    flete: '',
    costoFinalEntrada: ''
  });
  const [modalEntradaAbierto, setModalEntradaAbierto] = useState(false);
  const [pinDialogAbierto, setPinDialogAbierto] = useState(false);
  const [pin, setPin] = useState('');
  const [camposDesbloqueados, setCamposDesbloqueados] = useState(false);
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ 
    key: 'fechaIngreso', 
    direction: 'desc' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [showFinancials, setShowFinancials] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [openChangeKey, setOpenChangeKey] = useState(false);
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [loadingKey, setLoadingKey] = useState(false);

  // PIN válido (puedes cambiarlo o obtenerlo desde el backend)
  const PIN_VALIDO = '1234';

  // Configurar moment para usar español
  moment.locale('es');

  const cargarProductos = useCallback(async () => {
    if (cargando) return;
    
    try {
      setCargando(true);
      
      const response = await axios.get(`${API_URL}/productos`);
      const datosProductos = response.data?.productos || response.data || [];
      
      const productosTransformados = datosProductos
        .map(p => {
          const producto = transformarProducto(p);
          if (producto && producto.fechaIngreso) {
            producto.fechaIngreso = normalizarFecha(producto.fechaIngreso);
          }
          return producto;
        })
        .filter(p => p !== null)
        .sort((a, b) => {
          const dateA = new Date(a.fechaIngreso);
          const dateB = new Date(b.fechaIngreso);
          return dateB - dateA;
        });
      
      setProductos(productosTransformados);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setCargando(false);
    }
  }, [cargando]);

  const normalizarFecha = (fecha) => {
    if (!fecha) return '';
    
    // Convertir a objeto Date si es string
    const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha;
    
    // Formatear a YYYY-MM-DD (formato que acepta el input date)
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObj.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    cargarProductos();
  }, [cargarProductos]);

  const abrirEditar = (producto) => {
    try {
      console.log("Producto original a editar:", producto);
      
      // Asegurar que tengamos un ID válido
      const productoId = producto._id || producto.id;
      
      // Formatear fecha correctamente para el formulario
      // Usar moment.utc para mantener la fecha en UTC y evitar conversiones a zona horaria local
      let fechaFormateada = '';
      if (producto.fechaIngreso) {
        // Usar UTC para evitar problemas de zona horaria
        const fechaUTC = moment.utc(producto.fechaIngreso);
        if (fechaUTC.isValid()) {
          // Formatear en YYYY-MM-DD manteniendo la fecha UTC
          fechaFormateada = fechaUTC.format('YYYY-MM-DD');
        } else {
          console.warn("Fecha inválida:", producto.fechaIngreso);
          fechaFormateada = moment.utc().format('YYYY-MM-DD');
        }
      } else {
        fechaFormateada = moment.utc().format('YYYY-MM-DD');
      }
      
      console.log("Fecha original:", producto.fechaIngreso);
      console.log("Fecha formateada para edición:", fechaFormateada);
      
      // Normalizar el producto para edición
      const productoNormalizado = {
        ...producto,
        _id: productoId,
        fechaIngreso: fechaFormateada, // Usar fecha ya formateada en UTC
        stockActual: producto.stock // Mantener referencia al stock actual
      };
      
      setProductoEditando(productoNormalizado);
      setMostrarFormulario(true);
    } catch (error) {
      console.error("Error al preparar producto para edición:", error);
      toast.error("Error al preparar el producto para edición");
    }
  };

  const actualizarProducto = (productoActualizado) => {
    try {
      // Asegurarse de que la fecha esté en formato correcto para el backend
      const productoPreparado = { ...productoActualizado };
      
      if (productoPreparado.fechaIngreso) {
        // Convertir a formato ISO para el backend
        const fechaObj = new Date(productoPreparado.fechaIngreso);
        productoPreparado.fechaIngreso = fechaObj.toISOString();
      }
      
      const productoTransformado = transformarProducto(productoPreparado);
      
      if (!productoTransformado) {
        toast.error('Error procesando el producto actualizado');
        return;
      }

      // Actualizar estado local sin solicitud redundante al backend
      const nuevosProductos = productos.map(p => 
        p.id === productoTransformado.id ? productoTransformado : p
      );
      
      setProductos(nuevosProductos);
      
      // Reset estados para evitar problemas al agregar nuevos productos
      setProductoEditando(null);
      setMostrarFormulario(false);
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
      toast.error('Error al actualizar el producto');
      
      // Resetear estados incluso si hay error
      setProductoEditando(null);
      setMostrarFormulario(false);
    }
  };

  const handleProductoGuardado = (nuevoProducto) => {
    const esActualizacion = nuevoProducto._id || nuevoProducto.id;

    if (esActualizacion) {
      actualizarProducto(nuevoProducto);
      toast.success(`Producto ${nuevoProducto.codigo || ''} actualizado correctamente`);
    } else {
      try {
        const productoTransformado = transformarProducto(nuevoProducto);
        if (!productoTransformado) {
          toast.error('Error procesando el nuevo producto');
          return;
        }

        // Agregar al estado manteniendo el orden por fecha
        setProductos(prevProductos => {
          const nuevosProductos = [productoTransformado, ...prevProductos];
          return nuevosProductos.sort((a, b) => {
            const dateA = new Date(a.fechaIngreso);
            const dateB = new Date(b.fechaIngreso);
            return dateB - dateA;
          });
        });
        
        toast.success('Producto agregado correctamente');
      } catch (error) {
        console.error('Error al procesar nuevo producto:', error);
        toast.error('Error al agregar el producto');
      }
    }

    setProductoEditando(null);
    setMostrarFormulario(false);
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

  const actualizarListaProductos = (productoActualizado) => {
    console.log("Actualizando lista con producto:", productoActualizado);
    
    if (!productoActualizado) {
      console.warn("No se recibió un producto válido para actualizar");
      cargarProductos();
      return;
    }
    
    try {
      // Transformar el producto recibido para asegurar formato consistente
      const productoTransformado = transformarProducto(productoActualizado);
      
      if (!productoTransformado) {
        console.warn("No se pudo transformar el producto:", productoActualizado);
        cargarProductos();
        return;
      }
      
      // Obtener ID del producto
      const productoId = productoTransformado._id || productoTransformado.id;
      
      // Verificar si es un producto nuevo o uno existente actualizado
      const existeProducto = productos.some(p => 
        (p._id === productoId || p.id === productoId)
      );
      
      if (existeProducto) {
        console.log("Actualizando producto existente ID:", productoId);
        const nuevosProductos = productos.map(p => 
          (p._id === productoId || p.id === productoId) ? productoTransformado : p
        );
        setProductos([...nuevosProductos]);
      } else {
        console.log("Agregando nuevo producto ID:", productoId);
        setProductos(prevProductos => [productoTransformado, ...prevProductos]);
      }
      
    } catch (error) {
      console.error("Error actualizando la lista de productos:", error);
      cargarProductos();
    }
  };

  const abrirEntradaStock = (producto) => {
    setEntradaStock({
      productoId: producto.id,
      cantidad: '',
      proveedor: producto.proveedor,
      fechaHora: '',
      costoInicial: producto.costoInicial || 0,
      acarreo: producto.acarreo || 0,
      flete: producto.flete || 0,
      costoFinalEntrada: producto.costoFinal || 0
    });
    setModalEntradaAbierto(true);
  };

  const agregarStock = async () => {
    if (isSubmitting || !entradaStock.fechaHora) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const productoActual = productos.find(p => p.id === entradaStock.productoId);
      const cantidadIngresada = Number(entradaStock.cantidad);
      
      const fechaUTC = moment.utc(entradaStock.fechaHora, 'YYYY-MM-DD')
        .startOf('day')
        .toISOString();

      await axios.post(
        `${API_URL}/productos/${productoActual.id}/entradas`,
        {
          cantidad: cantidadIngresada,
          fechaHora: fechaUTC,
          costoUnitario: Number(entradaStock.costoInicial),
          acarreo: Number(entradaStock.acarreo),
          flete: Number(entradaStock.flete),
          costoFinalEntrada: Number(entradaStock.costoFinalEntrada)
        }
      );

      // Actualizar estado local
      const nuevosProductos = productos.map(p => {
        if (p.id === productoActual.id) {
          return {
            ...p,
            stock: p.stock + cantidadIngresada,
            cantidad: p.cantidad + cantidadIngresada
          };
        }
        return p;
      });
      
      setProductos(nuevosProductos);
      
      // Si el producto editando es el mismo, actualizar estado
      if (productoEditando?.id === productoActual.id) {
        setProductoEditando(prev => ({
          ...prev,
          stock: prev.stock + cantidadIngresada,
          cantidad: prev.cantidad + cantidadIngresada
        }));
      }
      
      toast.success(`Se agregaron ${cantidadIngresada} unidades al stock`);
      
      // Resetear formulario
      setEntradaStock({
        productoId: null,
        cantidad: '',
        proveedor: '',
        fechaHora: '',
        costoInicial: '',
        acarreo: '',
        flete: '',
        costoFinalEntrada: ''
      });

    } catch (error) {
      console.error('Error al agregar stock:', error);
      toast.error('Error al agregar stock');
    } finally {
      setIsSubmitting(false);
      setModalEntradaAbierto(false);
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSort = useCallback((key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  const sortedData = [...productos].sort((a, b) => {
    if (sortConfig.key === 'fechaIngreso') {
      const dateA = new Date(a.fechaIngreso);
      const dateB = new Date(b.fechaIngreso);
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    }
    
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

  // Función para manejar el desbloqueo
  const handlePasswordSubmit = async () => {
    try {
      // Consultar la clave actual al backend
      const response = await axios.get(`${API_URL}/unlock-key`);
      const claveActual = response.data.key;

      if (passwordInput === claveActual) {
        setShowFinancials(true);
        setPasswordDialogOpen(false);
        setPasswordInput('');
        setPasswordError(false);
        toast.success('Campos sensibles desbloqueados');
      } else {
        setPasswordError(true);
        toast.error('Contraseña incorrecta');
      }
    } catch (error) {
      toast.error('Error al verificar la clave');
      setPasswordError(true);
    }
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

  const handleChangeUnlockKey = async (e) => {
    e.preventDefault();
    setLoadingKey(true);
    try {
      const res = await axios.post(`${API_URL}/unlock-key/change`, {
        currentKey,
        newKey
      });
      if (res.data.success) {
        toast.success('Clave cambiada correctamente');
        setOpenChangeKey(false);
        setCurrentKey('');
        setNewKey('');
      } else {
        toast.error(res.data.message || 'Error al cambiar la clave');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error al cambiar la clave');
    } finally {
      setLoadingKey(false);
    }
  };

  useEffect(() => {
    const { costoInicial, acarreo, flete, cantidad } = entradaStock;
    const cantidadNum = Number(cantidad) || 0;
    const costoInicialNum = Number(costoInicial) || 0;
    const acarreoNum = Number(acarreo) || 0;
    const fleteNum = Number(flete) || 0;

    let costoFinal = 0;
    if (cantidadNum > 0) {
      costoFinal = ((costoInicialNum * cantidadNum) + acarreoNum + fleteNum) / cantidadNum;
    }
    setEntradaStock(prev => ({
      ...prev,
      costoFinalEntrada: isNaN(costoFinal) ? 0 : Number(costoFinal.toFixed(2))
    }));
    // eslint-disable-next-line
  }, [entradaStock.costoInicial, entradaStock.acarreo, entradaStock.flete, entradaStock.cantidad]);

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

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          {!showFinancials && (
            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => setPasswordDialogOpen(true)}
              sx={{ borderRadius: '25px', px: 3 }}
            >
              Desbloquear Detalles
            </Button>
          )}
        </Box>

        <Button
          variant="text"
          size="small"
          onClick={() => setOpenChangeKey(true)}
          sx={{ textTransform: 'none', color: 'primary.main', ml: 2 }}
        >
          Cambiar clave de desbloqueo
        </Button>

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
                  {showFinancials && (
                    <>
                      <StyledTableCell align="right">Costo Inicial ($)</StyledTableCell>
                      <StyledTableCell align="right">Acarreo ($)</StyledTableCell>
                      <StyledTableCell align="right">Flete ($)</StyledTableCell>
                    </>
                  )}
                  <StyledTableCell align="right">Cantidad</StyledTableCell>
                  {showFinancials && (
                    <StyledTableCell align="right">Costo Final ($)</StyledTableCell>
                  )}
                  <StyledTableCell align="right">Stock</StyledTableCell>
                  <StyledTableCell align="right">Fecha Registro</StyledTableCell>
                  <StyledTableCell align="center">Acciones</StyledTableCell>
                </TableRow>
              </TableHead>
              
              <TableBody>
                {currentItems.map((producto) => (
                  <StyledTableRow key={producto.id}>
                    <StyledTableCell>{producto.nombre}</StyledTableCell>
                    <StyledTableCell align="right">{producto.codigo}</StyledTableCell>
                    <StyledTableCell align="right">{producto.proveedor}</StyledTableCell>
                    {showFinancials && (
                      <>
                        <StyledTableCell align="right">
                          <CeldasSensibles producto={producto} />
                        </StyledTableCell>
                        <StyledTableCell align="right">${producto.acarreo.toFixed(2)}</StyledTableCell>
                        <StyledTableCell align="right">${producto.flete.toFixed(2)}</StyledTableCell>
                      </>
                    )}
                    <StyledTableCell align="right">{producto.cantidad}</StyledTableCell>
                    {showFinancials && (
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
                      {producto.fechaIngreso instanceof Date && !isNaN(producto.fechaIngreso) 
                        ? moment.utc(producto.fechaIngreso).add(1, 'days').format('DD/MM/YYYY')
                        : typeof producto.fechaIngreso === 'string' && producto.fechaIngreso
                          ? moment.utc(new Date(producto.fechaIngreso)).add(1, 'days').format('DD/MM/YYYY')
                          : 'Fecha inválida'}
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
          <HistorialEntradas productos={productos} showFinancials={showFinancials} />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <HistorialSalidas
            productos={productos}
            showFinancials={showFinancials}
          />
        </TabPanel>
      </Paper>

      <AgregarProducto
        open={mostrarFormulario}
        onClose={() => {
          setMostrarFormulario(false);
          setProductoEditando(null);
        }}
        productoEditando={productoEditando}
        onProductoGuardado={handleProductoGuardado}
      />

      <Dialog open={modalEntradaAbierto} onClose={() => setModalEntradaAbierto(false)}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>Agregar Stock</DialogTitle>
        <DialogContent>
          <TextField
            label="Fecha"
            type="date"
            value={entradaStock.fechaHora || moment().format('YYYY-MM-DD')}
            onChange={(e) => setEntradaStock({ ...entradaStock, fechaHora: e.target.value })}
            fullWidth
            margin="normal"
            InputLabelProps={{
              shrink: true,
            }}
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
          <TextField
            fullWidth
            label="Costo Inicial"
            type="number"
            value={entradaStock.costoInicial}
            onChange={(e) => setEntradaStock({ ...entradaStock, costoInicial: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Acarreo"
            type="number"
            value={entradaStock.acarreo}
            onChange={(e) => setEntradaStock({ ...entradaStock, acarreo: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Flete"
            type="number"
            value={entradaStock.flete}
            onChange={(e) => setEntradaStock({ ...entradaStock, flete: e.target.value })}
            margin="normal"
          />
          <TextField
            fullWidth
            label="Costo Final de la Entrada"
            type="number"
            value={entradaStock.costoFinalEntrada}
            margin="normal"
            InputProps={{
              readOnly: true,
            }}
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

      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle>Acceso a detalles financieros</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ingrese la contraseña para ver los detalles financieros (precios y ganancias)
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Contraseña"
            type="password"
            fullWidth
            variant="standard"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            error={passwordError}
            helperText={passwordError ? "Contraseña incorrecta" : ""}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handlePasswordSubmit} color="primary">Ingresar</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openChangeKey} onClose={() => setOpenChangeKey(false)}>
        <DialogTitle>Cambiar clave de desbloqueo</DialogTitle>
        <DialogContent>
          <form onSubmit={handleChangeUnlockKey}>
            <TextField
              label="Clave actual"
              type="password"
              fullWidth
              margin="normal"
              value={currentKey}
              onChange={e => setCurrentKey(e.target.value)}
              required
            />
            <TextField
              label="Nueva clave"
              type="password"
              fullWidth
              margin="normal"
              value={newKey}
              onChange={e => setNewKey(e.target.value)}
              required
            />
            <DialogActions>
              <Button onClick={() => setOpenChangeKey(false)}>Cancelar</Button>
              <Button type="submit" color="primary" disabled={loadingKey}>
                Cambiar clave
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <ToastContainer />
    </Container>
  );
};

export default GestionInventario;
