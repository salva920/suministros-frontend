import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Button, Container, TextField, Typography, Grid, 
  Paper, IconButton, Chip, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, MenuItem, FormGroup, FormControlLabel, Checkbox,
  InputLabel, Select, FormControl, Dialog, DialogTitle, DialogContent, 
  DialogActions, LinearProgress, CircularProgress, useTheme, useMediaQuery,
  Divider, InputAdornment, Tooltip, Alert, AlertTitle
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { toast, ToastContainer } from 'react-toastify';
import { 
  ExpandMore, ExpandLess, 
  Edit, Delete, AssignmentInd, Dashboard, PersonSearch, 
  Receipt, Close, Add as AddIcon, Search as SearchIcon,
  Phone as PhoneIcon, Email as EmailIcon, LocationOn as LocationIcon,
  Badge as BadgeIcon, FilterAlt as FilterAltIcon,
  Refresh as RefreshIcon, Save as SaveIcon, Money as MoneyIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pagination from '@mui/material/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import 'react-toastify/dist/ReactToastify.css';
import RegistroClienteDialog from '../ventas/RegistroClienteDialog';
import { debounce } from 'lodash';


const API_URL = "https://suministros-backend.vercel.app/api"; // URL del backend en Vercel

// Variantes de animación para Framer Motion
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      when: "beforeChildren",
      staggerChildren: 0.05
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

// Componentes estilizados
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
    color: theme.palette.common.white,
    fontSize: '0.95rem',
    whiteSpace: 'nowrap',
    padding: '16px'
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.3s ease',
    boxShadow: '0 3px 10px rgba(0,0,0,0.1)',
    transform: 'translateY(-2px)',
  },
  transition: 'all 0.2s ease'
}));

const FormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
  background: 'linear-gradient(120deg, #fafafa 0%, #ffffff 100%)',
  overflow: 'hidden'
}));

const FilterContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(3),
  borderRadius: '12px',
  backgroundColor: theme.palette.background.paper,
  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2)
}));

const CategoryChip = styled(Chip)(({ theme }) => ({
  margin: theme.spacing(0.5),
  borderRadius: '8px',
  fontWeight: 'medium',
  boxShadow: '0 2px 5px rgba(0,0,0,0.08)',
  '&:hover': {
    boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
  },
  transition: 'all 0.2s ease'
}));

const ActionButton = styled(Button)(({ theme }) => ({
  borderRadius: '10px',
  textTransform: 'none',
  padding: '8px 16px',
  fontWeight: 'bold',
  boxShadow: '0 3px 5px rgba(0,0,0,0.1)',
  '&:hover': {
    boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)'
  },
  transition: 'all 0.2s ease'
}));

const RegistrarCliente = ({ onClienteRegistrado, dniPrecargado, modoModal, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [clientes, setClientes] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(1000);
  const [totalClientes, setTotalClientes] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [cliente, setCliente] = useState({
    _id: '',
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    municipio: '',
    rif: dniPrecargado || '',
    categorias: [],
    municipioColor: '#ffffff'
  });
  const [showForm, setShowForm] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [errores, setErrores] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    municipio: '',
    rif: '',
    categorias: ''
  });
  const [clienteEditando, setClienteEditando] = useState(null);
  const [ventas] = useState([]);
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [mostrarModalVentas, setMostrarModalVentas] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [mostrarRegistroDialog, setMostrarRegistroDialog] = useState(false);
  const [prefijoRif, setPrefijoRif] = useState('V');
  const [prefijoTelefono, setPrefijoTelefono] = useState('0412');
  const [colorMunicipio, setColorMunicipio] = useState('#ffffff');
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

  // Memoizar los valores calculados
  const municipiosDisponibles = useMemo(() => 
    [...new Set(clientes.map(c => c.municipio).filter(Boolean))],
    [clientes]
  );

  const categoriasDisponibles = useMemo(() => 
    ['Agente Retención', 'Alto Riesgo', 'Cliente Frecuente', 'Cliente VIP', 'Desconocido'],
    []
  );

  // Memoizar la función de filtrado
  const filtrarClientes = useCallback(() => {
    return clientes.filter(cliente => {
      const busquedaMatch = cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                          cliente.rif.toLowerCase().includes(busqueda.toLowerCase());
      
      const categoriaMatch = filtroCategoria ? 
                           cliente.categorias?.includes(filtroCategoria) : 
                           true;

      const municipioMatch = filtroMunicipio ? 
                           cliente.municipio.toLowerCase() === filtroMunicipio.toLowerCase() : 
                           true;

      return busquedaMatch && categoriaMatch && municipioMatch;
    });
  }, [busqueda, filtroCategoria, filtroMunicipio, clientes]);

  // Memoizar los clientes filtrados
  const clientesFiltrados = useMemo(() => 
    filtrarClientes(),
    [filtrarClientes]
  );

  // Debounce para la búsqueda
  const debouncedBusqueda = useCallback(
    debounce((value) => {
      setBusqueda(value);
    }, 300),
    []
  );

  // Optimizar el handleChange para campos de búsqueda
  const handleSearchChange = useCallback((e) => {
    const { value } = e.target;
    debouncedBusqueda(value);
  }, [debouncedBusqueda]);

  // Optimizar el handleChange para campos del formulario
  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));
  }, []);

  // Optimizar el handleChange para campos de filtro
  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name === 'municipio') {
      setFiltroMunicipio(value);
    } else if (name === 'categoria') {
      setFiltroCategoria(value);
    }
  }, []);

  const cargarClientes = useCallback(async (page = 1, limit = 1000) => {
    setCargando(true);
    try {
      // Si hay filtros activos, intentamos cargar todos los registros para filtrar en el cliente
      const hayFiltrosActivos = busqueda || filtroMunicipio || filtroCategoria;
      
      // URL de la API (siempre usando un límite de 1000 para obtener todos los registros)
      const url = `${API_URL}/clientes?page=1&limit=1000`;
      
      const response = await axios.get(url);
      setClientes(response.data.clientes);
      setTotalClientes(response.data.total);
      
      // Siempre mantenemos la página en 1
      setPagina(1);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar clientes');
    } finally {
      setCargando(false);
    }
  }, [busqueda, filtroMunicipio, filtroCategoria]);

  useEffect(() => {
    cargarClientes(pagina, porPagina);
  }, [cargarClientes, pagina, porPagina]);

  useEffect(() => {
    // Este efecto se ejecuta cuando cambian los filtros
    setPagina(1); // Resetear a página 1
    cargarClientes(1, porPagina); // Cargar clientes forzando página 1
  }, [busqueda, filtroMunicipio, filtroCategoria]);

  useEffect(() => {
    const filtered = filtrarClientes();
    setClientesFiltrados(filtered);
  }, [filtrarClientes]);

  const handleChangeColorMunicipio = (e) => {
    setColorMunicipio(e.target.value);
    setCliente(prev => ({
      ...prev,
      municipioColor: e.target.value
    }));
  };

  const validarCampos = () => {
    const nuevosErrores = {
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      municipio: '',
      rif: '',
      categorias: ''
    };

    let valido = true;

    const rifCompleto = prefijoRif + cliente.rif;
    let rifValido = true;

    if (prefijoRif === 'V') {
      if (cliente.rif.length < 8 || cliente.rif.length > 9) {
        nuevosErrores.rif = 'Cédula venezolana debe tener 8 o 9 dígitos';
        rifValido = false;
      }
    } else if (['E', 'J', 'G'].includes(prefijoRif)) {
      if (cliente.rif.length !== 9) {
        nuevosErrores.rif = 'RIF debe tener 9 dígitos para este tipo';
        rifValido = false;
      }
    } else if (!/^[VEJG][0-9]+$/.test(rifCompleto)) {
      nuevosErrores.rif = 'Formato de RIF inválido';
      rifValido = false;
    }

    if (!cliente.nombre || cliente.nombre.trim() === '') {
      nuevosErrores.nombre = 'El nombre es requerido';
      valido = false;
    }

    if (!rifValido) {
      valido = false;
    }

    if (cliente.email && !/\S+@\S+\.\S+/.test(cliente.email)) {
      nuevosErrores.email = 'Email inválido';
      valido = false;
    }

    setErrores(nuevosErrores);
    return valido;
  };

  const crearActualizarCliente = async (e) => {
    e.preventDefault();
    if (!validarCampos()) {
      toast.error('Por favor corrige los errores en el formulario');
      return;
    }

    const clienteData = {
      ...cliente,
      rif: prefijoRif + cliente.rif,
      telefono: prefijoTelefono && cliente.telefono ? `${prefijoTelefono}-${cliente.telefono}` : cliente.telefono
    };

    setCargando(true);
    try {
      let response;
      // Si estamos editando
      if (cliente._id) {
        response = await axios.put(`${API_URL}/clientes/${cliente._id}`, clienteData);
        toast.success('Cliente actualizado correctamente');
      } else {
        // Si estamos creando uno nuevo
        response = await axios.post(`${API_URL}/clientes`, clienteData);
        toast.success('Cliente registrado correctamente');
      }

      setCliente({
        nombre: '',
        telefono: '',
        email: '',
        direccion: '',
        municipio: '',
        rif: '',
        categorias: [],
        municipioColor: '#ffffff'
      });
      
      setShowForm(false);
      setPrefijoRif('V');
      setPrefijoTelefono('0412');
      cargarClientes();
      
      if (onClienteRegistrado) {
        onClienteRegistrado(response.data.cliente);
      }
      
      if (modoModal && onClose) {
        onClose();
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data && error.response.data.mensaje) {
        toast.error(error.response.data.mensaje);
      } else {
        toast.error('Error al procesar el cliente');
      }
    } finally {
      setCargando(false);
    }
  };

  const handleEditarCliente = (cliente) => {
    // Dividir el RIF en prefijo y número
    let prefijo = 'V';
    let numero = cliente.rif;
    
    if (cliente.rif && cliente.rif.length > 0) {
      prefijo = cliente.rif.charAt(0);
      numero = cliente.rif.substring(1);
    }
    setPrefijoRif(prefijo);
    
    // Dividir el teléfono en prefijo y número si existe
    let prefTelefono = '0412';
    let numTelefono = '';
    
    if (cliente.telefono && cliente.telefono.includes('-')) {
      const telParts = cliente.telefono.split('-');
      prefTelefono = telParts[0];
      numTelefono = telParts[1];
    } else {
      numTelefono = cliente.telefono || '';
    }
    setPrefijoTelefono(prefTelefono);
    
    setCliente({
      ...cliente,
      rif: numero,
      telefono: numTelefono,
      municipioColor: cliente.municipioColor || '#ffffff'
    });
    
    setColorMunicipio(cliente.municipioColor || '#ffffff');
    setClienteEditando(cliente);
    setShowForm(true);
  };

  const handleEliminarCliente = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      setCargando(true);
      try {
        await axios.delete(`${API_URL}/clientes/${id}`);
        toast.success('Cliente eliminado correctamente');
        cargarClientes();
      } catch (error) {
        console.error(error);
        toast.error('Error al eliminar el cliente');
      } finally {
        setCargando(false);
      }
    }
  };

  const handleVerVentas = (cliente) => {
    setClienteSeleccionado(cliente);
    setMostrarRegistroDialog(true);
  };

  const handleCheckboxChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setCliente(prev => ({
        ...prev,
        categorias: [...(prev.categorias || []), value]
      }));
    } else {
      setCliente(prev => ({
        ...prev,
        categorias: (prev.categorias || []).filter(cat => cat !== value)
      }));
    }
  };

  const manejarCambioPagina = (event, value) => {
    // No necesitamos cambiar la página ya que todos los registros están en la página 1
    // Mantenemos esta función por compatibilidad con la interfaz
    setPagina(1);
  };

  const manejarCambioPorPagina = (event) => {
    // No necesitamos cambiar el número de registros por página
    // Mantenemos esta función por compatibilidad con la interfaz
    setPorPagina(1000);
    setPagina(1);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      transition={{ duration: 0.5 }}
    >
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {/* === BOTÓN IR AL DASHBOARD === */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Dashboard />}
            onClick={() => navigate('/dashboard')}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              boxShadow: '0 3px 5px rgba(33, 150, 243, .2)'
            }}
          >
            Ir al Dashboard
          </Button>
        </Box>
        {/* === FIN BOTÓN === */}

        <Paper 
          elevation={3} 
          sx={{ 
            p: 3, 
            borderRadius: '16px',
            background: 'linear-gradient(to right, #f5f7fa, #ffffff)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 3,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}>
            <Typography 
              variant="h4" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <AssignmentInd fontSize="large" sx={{ color: '#1976d2' }} /> 
              Gestión de Clientes
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ActionButton
                  variant="contained"
                  startIcon={showForm ? <ExpandLess /> : <ExpandMore />}
                  onClick={() => setShowForm(!showForm)}
                  sx={{ 
                    background: showForm 
                      ? 'linear-gradient(45deg, #e53935 30%, #f44336 90%)' 
                      : 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    color: 'white'
                  }}
                >
                  {showForm ? 'Cerrar Formulario' : 'Registrar Cliente'}
                </ActionButton>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <ActionButton
                  variant="outlined"
                  startIcon={<FilterAltIcon />}
                  onClick={() => setShowFilters(!showFilters)}
                  color="primary"
                >
                  Filtros
                </ActionButton>
              </motion.div>
            </Box>
          </Box>
          
          {/* Contenedor de filtros */}
          <Collapse in={showFilters}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FilterContainer>
                <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Filtros de Búsqueda
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Buscar por nombre o RIF"
                      variant="outlined"
                      value={busqueda}
                      onChange={handleSearchChange}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon color="primary" />
                          </InputAdornment>
                        ),
                        sx: { borderRadius: '10px' }
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Filtrar por municipio</InputLabel>
                      <Select
                        value={filtroMunicipio}
                        onChange={handleFilterChange}
                        name="municipio"
                        label="Filtrar por municipio"
                        sx={{ borderRadius: '10px' }}
                      >
                        <MenuItem value="">Todos los municipios</MenuItem>
                        {municipiosDisponibles.map((municipio, index) => (
                          <MenuItem key={index} value={municipio}>{municipio}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>Filtrar por categoría</InputLabel>
                      <Select
                        value={filtroCategoria}
                        onChange={handleFilterChange}
                        name="categoria"
                        label="Filtrar por categoría"
                        sx={{ borderRadius: '10px' }}
                      >
                        <MenuItem value="">Todas las categorías</MenuItem>
                        {categoriasDisponibles.map((categoria, index) => (
                          <MenuItem key={index} value={categoria}>{categoria}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <ActionButton
                      variant="outlined"
                      startIcon={<RefreshIcon />}
                      onClick={() => {
                        setBusqueda('');
                        setFiltroMunicipio('');
                        setFiltroCategoria('');
                      }}
                    >
                      Limpiar Filtros
                    </ActionButton>
                  </motion.div>
                </Box>
              </FilterContainer>
            </motion.div>
          </Collapse>

          {/* Formulario de cliente */}
          <Collapse in={showForm}>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <FormPaper>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 3, 
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  {cliente._id ? <EditIcon color="primary" /> : <AddIcon color="primary" />}
                  {cliente._id ? 'Editar Cliente' : 'Nuevo Cliente'}
                </Typography>
                
                <form onSubmit={crearActualizarCliente}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Nombre del Cliente"
                        name="nombre"
                        value={cliente.nombre || ''}
                        onChange={handleFormChange}
                        variant="outlined"
                        required
                        error={!!errores.nombre}
                        helperText={errores.nombre}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <BadgeIcon color="primary" />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: '10px' }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControl sx={{ width: '30%' }}>
                          <InputLabel>Tipo</InputLabel>
                          <Select
                            value={prefijoRif}
                            onChange={(e) => setPrefijoRif(e.target.value)}
                            label="Tipo"
                            sx={{ borderRadius: '10px' }}
                          >
                            <MenuItem value="V">V</MenuItem>
                            <MenuItem value="E">E</MenuItem>
                            <MenuItem value="J">J</MenuItem>
                            <MenuItem value="G">G</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <TextField
                          fullWidth
                          label="Cédula/RIF"
                          name="rif"
                          value={cliente.rif || ''}
                          onChange={handleFormChange}
                          variant="outlined"
                          required
                          error={!!errores.rif}
                          helperText={errores.rif}
                          InputProps={{
                            sx: { borderRadius: '10px' }
                          }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <FormControl sx={{ width: '30%' }}>
                          <InputLabel>Prefijo</InputLabel>
                          <Select
                            value={prefijoTelefono}
                            onChange={(e) => setPrefijoTelefono(e.target.value)}
                            label="Prefijo"
                            sx={{ borderRadius: '10px' }}
                          >
                            <MenuItem value="0412">0412</MenuItem>
                            <MenuItem value="0414">0414</MenuItem>
                            <MenuItem value="0416">0416</MenuItem>
                            <MenuItem value="0424">0424</MenuItem>
                            <MenuItem value="0426">0426</MenuItem>
                            <MenuItem value="0212">0212</MenuItem>
                          </Select>
                        </FormControl>
                        
                        <TextField
                          fullWidth
                          label="Teléfono"
                          name="telefono"
                          value={cliente.telefono || ''}
                          onChange={handleFormChange}
                          variant="outlined"
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PhoneIcon color="primary" />
                              </InputAdornment>
                            ),
                            sx: { borderRadius: '10px' }
                          }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        value={cliente.email || ''}
                        onChange={handleFormChange}
                        variant="outlined"
                        error={!!errores.email}
                        helperText={errores.email}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailIcon color="primary" />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: '10px' }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="Dirección"
                        name="direccion"
                        value={cliente.direccion || ''}
                        onChange={handleFormChange}
                        variant="outlined"
                        multiline
                        rows={2}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <LocationIcon color="primary" />
                            </InputAdornment>
                          ),
                          sx: { borderRadius: '10px' }
                        }}
                      />
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          fullWidth
                          label="Municipio"
                          name="municipio"
                          value={cliente.municipio || ''}
                          onChange={handleFormChange}
                          variant="outlined"
                          InputProps={{
                            sx: { borderRadius: '10px' }
                          }}
                        />
                        
                        <TextField
                          label="Color"
                          type="color"
                          value={colorMunicipio}
                          onChange={handleChangeColorMunicipio}
                          sx={{ width: '100px' }}
                          InputProps={{
                            sx: { borderRadius: '10px' }
                          }}
                        />
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                        Categorías:
                      </Typography>
                      <FormGroup row>
                        {categoriasDisponibles.map((categoria) => (
                          <FormControlLabel
                            key={categoria}
                            control={
                              <Checkbox
                                checked={(cliente.categorias || []).includes(categoria)}
                                onChange={handleCheckboxChange}
                                value={categoria}
                              />
                            }
                            label={categoria}
                          />
                        ))}
                      </FormGroup>
                      {errores.categorias && (
                        <Typography color="error" variant="caption">
                          {errores.categorias}
                        </Typography>
                      )}
                    </Grid>
                    
                    <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <ActionButton
                          type="button"
                          variant="outlined"
                          color="error"
                          onClick={() => {
                            setCliente({
                              nombre: '',
                              telefono: '',
                              email: '',
                              direccion: '',
                              municipio: '',
                              rif: '',
                              categorias: [],
                              municipioColor: '#ffffff'
                            });
                            setPrefijoRif('V');
                            setPrefijoTelefono('0412');
                            setColorMunicipio('#ffffff');
                            setClienteEditando(null);
                          }}
                          disabled={cargando}
                          startIcon={<Close />}
                        >
                          Limpiar
                        </ActionButton>
                      </motion.div>
                      
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <ActionButton
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={cargando}
                          startIcon={cargando ? <CircularProgress size={24} /> : <SaveIcon />}
                          sx={{ 
                            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                            boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                          }}
                        >
                          {cargando ? 'Guardando...' : (cliente._id ? 'Actualizar' : 'Guardar')}
                        </ActionButton>
                      </motion.div>
                    </Grid>
                  </Grid>
                </form>
              </FormPaper>
            </motion.div>
          </Collapse>

          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="h5" 
              sx={{ 
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <AssignmentInd /> Listado de Clientes
            </Typography>
            
            {clientesFiltrados.length > 0 && (
              <Chip 
                label={`${clientesFiltrados.length} ${clientesFiltrados.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}`}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>

          {clientesFiltrados.length === 0 ? (
            <Alert 
              severity="info"
              sx={{ 
                borderRadius: '10px', 
                mb: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
              }}
            >
              <AlertTitle>Sin resultados</AlertTitle>
              No se encontraron clientes con los criterios de búsqueda. Intenta ajustar los filtros o registra un nuevo cliente.
            </Alert>
          ) : (
            <TableContainer 
              component={Paper} 
              sx={{ 
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                overflow: 'hidden',
                mb: 3
              }}
            >
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>Nombre</StyledTableCell>
                    <StyledTableCell>Contacto</StyledTableCell>
                    <StyledTableCell>Dirección</StyledTableCell>
                    <StyledTableCell>Municipio</StyledTableCell>
                    <StyledTableCell align="center">Acciones</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <AnimatePresence>
                    {clientesFiltrados.map((cliente) => (
                      <motion.tr
                        key={cliente.id || cliente._id}
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        exit={{ opacity: 0, y: 20 }}
                        component={StyledTableRow}
                      >
                        <TableCell>
                          <Box>
                            <Typography 
                              fontWeight="bold"
                              sx={{
                                p: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                                backgroundColor: cliente.categorias?.includes('Agente Retención') ? 
                                  'rgba(255, 235, 59, 0.2)' : cliente.categorias?.includes('Alto Riesgo') ? 
                                  'rgba(244, 67, 54, 0.1)' : 'transparent',
                                color: cliente.categorias?.includes('Alto Riesgo') ? '#d32f2f' : 'inherit'
                              }}
                            >
                              {cliente.nombre}
                            </Typography>
                            <Chip 
                              label={`CI: ${cliente.rif}`} 
                              size="small" 
                              color="info" 
                              variant="outlined"
                              sx={{ mt: 1, borderRadius: '8px' }}
                            />
                          </Box>
                          {cliente.categorias && cliente.categorias.length > 0 && (
                            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {cliente.categorias.map(cat => (
                                <CategoryChip 
                                  key={cat}
                                  label={cat}
                                  size="small"
                                  color={
                                    cat === "Alto Riesgo" ? "error" : 
                                    cat === "Agente Retención" ? "warning" : 
                                    cat === "Preferencial" ? "success" : "default"
                                  }
                                  variant="filled"
                                />
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {cliente.telefono && (
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  color: 'text.secondary'
                                }}
                              >
                                <PhoneIcon fontSize="small" color="primary" />
                                {cliente.telefono}
                              </Typography>
                            )}
                            {cliente.email && (
                              <Typography 
                                variant="body2"
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 1,
                                  color: 'text.secondary'
                                }}
                              >
                                <EmailIcon fontSize="small" color="primary" />
                                {cliente.email}
                              </Typography>
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 1 
                            }}
                          >
                            <LocationIcon fontSize="small" color="primary" />
                            {cliente.direccion || "No registrada"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              backgroundColor: cliente.municipioColor || '#f0f0f0',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              display: 'inline-block',
                              fontWeight: 'medium',
                              color: theme.palette.getContrastText(cliente.municipioColor || '#f0f0f0'),
                              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                              border: '1px solid rgba(0,0,0,0.05)'
                            }}
                          >
                            {cliente.municipio || "No registrado"}
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                            <Tooltip title="Editar Cliente">
                              <IconButton 
                                color="primary"
                                onClick={() => handleEditarCliente(cliente)}
                                sx={{ 
                                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.2)' }
                                }}
                              >
                                <Edit />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Eliminar Cliente">
                              <IconButton 
                                color="error"
                                onClick={() => handleEliminarCliente(cliente.id || cliente._id)}
                                sx={{ 
                                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.2)' }
                                }}
                              >
                                <Delete />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Ver Historial de Ventas">
                              <IconButton
                                color="info"
                                onClick={() => handleVerVentas(cliente)}
                                sx={{ 
                                  backgroundColor: 'rgba(3, 169, 244, 0.1)',
                                  '&:hover': { backgroundColor: 'rgba(3, 169, 244, 0.2)' }
                                }}
                              >
                                <Receipt />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </TableContainer>
          )}

          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mt: 2,
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0
            }}
          >
            <FormControl variant="outlined" size="small">
              <InputLabel>Por página</InputLabel>
              <Select
                value={porPagina}
                onChange={manejarCambioPorPagina}
                label="Por página"
                sx={{ borderRadius: '10px', minWidth: '120px' }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>

            <Pagination
              count={Math.ceil(clientesFiltrados.length / porPagina)}
              page={pagina}
              onChange={manejarCambioPagina}
              color="primary"
              shape="rounded"
              showFirstButton
              showLastButton
              disabled={clientesFiltrados.length <= porPagina}
              sx={{ 
                '& .MuiPaginationItem-root': {
                  borderRadius: '8px'
                }
              }}
            />
          </Box>
        </Paper>

        <AnimatePresence>
          {mostrarRegistroDialog && (
            <RegistroClienteDialog
              open={mostrarRegistroDialog}
              onClose={() => setMostrarRegistroDialog(false)}
              clienteSeleccionado={clienteSeleccionado}
              onDataUpdated={() => {
                cargarClientes(); // Refrescar la lista de clientes
              }}
            />
          )}
        </AnimatePresence>

        <Dialog open={mostrarModalVentas} onClose={() => setMostrarModalVentas(false)}>
          <DialogTitle 
            sx={{ 
              bgcolor: 'primary.main', 
              color: 'white',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)'
            }}
          >
            Ventas
          </DialogTitle>
          <DialogContent sx={{ pt: 3, p: 3, bgcolor: '#ffffff' }}>
            {/* Contenido del diálogo */}
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: '#ffffff' }}>
            <Button 
              onClick={() => setMostrarModalVentas(false)}
              variant="outlined" 
              sx={{ borderRadius: '10px', textTransform: 'none' }}
            >
              Cerrar
            </Button>
          </DialogActions>
        </Dialog>

        {cargando && (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              color="secondary" 
              sx={{
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                }
              }}
            />
          </Box>
        )}
        
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

// Optimizar el componente con memo y comparación personalizada
export default React.memo(RegistrarCliente, (prevProps, nextProps) => {
  return (
    prevProps.onClienteRegistrado === nextProps.onClienteRegistrado &&
    prevProps.dniPrecargado === nextProps.dniPrecargado &&
    prevProps.modoModal === nextProps.modoModal &&
    prevProps.onClose === nextProps.onClose
  );
});