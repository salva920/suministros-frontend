import React, { useState, useEffect, useCallback } from 'react';
import { 
  Button, Container, TextField, Typography, Grid, 
  Paper, IconButton, Chip, Box,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Collapse, MenuItem, FormGroup, FormControlLabel, Checkbox,
  InputLabel, Select, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, LinearProgress, CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';
import { 
  ExpandMore, ExpandLess, 
  Edit, Delete, AssignmentInd, Dashboard, PersonSearch, Receipt
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Pagination from '@mui/material/Pagination';
import RegistroClienteDialog from '../ventas/RegistroClienteDialog'; 

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

const RegistrarCliente = ({ onClienteRegistrado, dniPrecargado, modoModal, onClose }) => {
  const [clientes, setClientes] = useState([]);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
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
  const [ventasCliente, setVentasCliente] = useState([]);
  const [prefijoRif, setPrefijoRif] = useState('V');
  const [prefijoTelefono, setPrefijoTelefono] = useState('0412');
  const [colorMunicipio, setColorMunicipio] = useState('#ffffff');
  const [mostrarDialogoVentas, setMostrarDialogoVentas] = useState(false);
  const [deudaTotal, setDeudaTotal] = useState(0);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const navigate = useNavigate();

  const cargarClientes = useCallback(async (page = pagina, limit = porPagina) => {
    setCargando(true);
    try {
      const response = await axios.get(`${API_URL}/clientes?page=${page}&limit=${limit}`);
      setClientes(response.data.clientes);
      setTotalClientes(response.data.total); // Asegurar total actualizado
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar clientes');
    } finally {
      setCargando(false);
    }
  }, [pagina, porPagina]);

 // Actualizar useEffect para recargar al cambiar página
useEffect(() => {
  cargarClientes(pagina, porPagina);
}, [pagina, porPagina, cargarClientes]);

  const filtrarClientes = useCallback(() => {
    return clientes.filter(cliente => {
      const busquedaMatch = cliente.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                           cliente.rif.toLowerCase().includes(busqueda.toLowerCase());
      
      const categoriaMatch = filtroCategoria ? 
                            cliente.categorias?.includes(filtroCategoria) : 
                            true;

      const municipioMatch = filtroMunicipio ? 
                            cliente.municipio === filtroMunicipio : 
                            true;

      return busquedaMatch && categoriaMatch && municipioMatch;
    });
  }, [busqueda, filtroCategoria, filtroMunicipio, clientes]);

  useEffect(() => {
    const filteredClientes = clientes.filter(cliente => {
      const coincideBusqueda = cliente.nombre.toLowerCase().includes(busqueda.toLowerCase());
      const coincideCategoria = filtroCategoria ? cliente.categorias.includes(filtroCategoria) : true;
      return coincideBusqueda && coincideCategoria;
    });
    setClientesFiltrados(filteredClientes);
  }, [busqueda, filtroCategoria, clientes]);

  const handleChange = (e) => {
    setCliente({ ...cliente, [e.target.name]: e.target.value });
  };

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

    if (prefijoRif === 'V' && cliente.rif.length !== 8) {
      nuevosErrores.rif = 'Cédula venezolana debe tener 8 dígitos';
      rifValido = false;
    } else if (['E', 'J', 'G'].includes(prefijoRif) && cliente.rif.length !== 9) {
      nuevosErrores.rif = 'RIF debe tener 9 dígitos para este tipo';
      rifValido = false;
    } else if (!/^[VEJG][0-9]+$/.test(rifCompleto)) {
      nuevosErrores.rif = 'Formato inválido';
      rifValido = false;
    }

    if (!rifValido) valido = false;

    if (!cliente.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
      valido = false;
    } else if (cliente.nombre.trim().length < 3) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 3 caracteres';
      valido = false;
    }

    if (!cliente.municipio.trim()) {
      nuevosErrores.municipio = 'El municipio es obligatorio';
      valido = false;
    }

    if (!/^\d{7}$/.test(cliente.telefono)) {
      nuevosErrores.telefono = 'El teléfono debe tener 7 dígitos';
      valido = false;
    }

    if (cliente.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cliente.email.trim())) {
      nuevosErrores.email = 'Ingrese un correo electrónico válido';
      valido = false;
    }

    if (cliente.direccion.trim() && cliente.direccion.trim().length < 5) {
      nuevosErrores.direccion = 'La dirección debe tener al menos 5 caracteres';
      valido = false;
    }

    setErrores(nuevosErrores);
    return valido;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validarCampos()) return;
  
    try {
      setCargandoVentas(true);
      const clienteData = {
        nombre: cliente.nombre,
        telefono: prefijoTelefono + cliente.telefono,
        email: cliente.email,
        direccion: cliente.direccion,
        municipio: cliente.municipio,
        rif: prefijoRif + cliente.rif,
        categorias: cliente.categorias,
        municipioColor: cliente.municipioColor
      };
  
      const method = clienteEditando ? 'put' : 'post';
      const url = clienteEditando 
        ? `${API_URL}/clientes/${clienteEditando._id}`
        : `${API_URL}/clientes`;
  
      const response = await axios[method](url, clienteData);
  
      if (response.data) {
        toast.success(clienteEditando ? 'Cliente actualizado correctamente' : 'Cliente registrado correctamente');
        setCliente({
          _id: '',
          nombre: '',
          telefono: '',
          email: '',
          direccion: '',
          municipio: '',
          rif: '',
          categorias: [],
          municipioColor: '#ffffff'
        });
        setClienteEditando(null);
        setShowForm(false);
        cargarClientes();
        if (onClienteRegistrado) {
          onClienteRegistrado(response.data);
        }
      }
    } catch (error) {
      toast.error(`Error al ${clienteEditando ? 'actualizar' : 'registrar'} el cliente: ${error.message}`);
    } finally {
      setCargandoVentas(false);
    }
  };

  const handleEliminarCliente = async (id) => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      toast.error('ID de cliente inválido');
      return;
    }

    try {
      await axios.delete(`${API_URL}/clientes/${id}`);
      toast.success('Cliente eliminado correctamente');
      cargarClientes(pagina, porPagina); // Recargar con paginación actual
    } catch (error) {
      console.error('Error al eliminar  el cliente:', error);
      toast.error(error.response?.data?.message || 'Error al eliminar el cliente');
    }
  };

  const handleEditarCliente = (cliente) => {
    setCliente({
      _id: cliente._id,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
    });

    const prefijo = cliente.telefono.match(/^0412|0426|0424|0416|0414/)?.[0] || '0412';
    setPrefijoTelefono(prefijo);

    setCliente(prev => ({
      ...prev,
      telefono: cliente.telefono.replace(prefijo, '')
    }));

    setClienteEditando(cliente);
    setShowForm(true);
  };

  const handleCancelarEdicion = () => {
    setClienteEditando(null);
    setCliente({
      _id: '',
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
  };

  // Modificar la función handleVerVentas para validar el ID
  const handleVerVentas = async (cliente) => {
    try {
      // Validación reforzada
      if (!cliente || !cliente.id || !mongoose.Types.ObjectId.isValid(cliente.id)) {
        throw new Error('Cliente no válido para consultar ventas');
      }
  
      setCargandoVentas(true);
      
      const response = await axios.get(`${API_URL}/ventas`, {
        params: {
          cliente: cliente._id,
          limit: 1000
        },
        timeout: 15000
      });
  
      if (!response.data?.ventas) {
        throw new Error('Estructura de respuesta incorrecta');
      }
  
      setVentasCliente(response.data.ventas);
      setMostrarDialogoVentas(true);
  
    } catch (error) {
      toast.error(`Error: ${error.message}`);
      console.error('Detalle técnico:', {
        clienteId: cliente?._id,
        error: error.response?.data || error.message
      });
    } finally {
      setCargandoVentas(false);
    }
  };

  useEffect(() => {
    clientesFiltrados.forEach(cliente => {
      const ventasCliente = ventas.filter(v => v.clienteId === cliente.id);
      const deudaTotal = ventasCliente.reduce((total, venta) => total + (venta.saldoPendiente || 0), 0);
      
      if (deudaTotal > 0) {
        const ventaMasAntigua = ventasCliente.reduce((antigua, venta) => {
          const fechaVenta = new Date(venta.fecha);
          return fechaVenta < antigua.fecha ? venta : antigua;
        });
        
        const diasDeuda = Math.floor((new Date() - new Date(ventaMasAntigua.fecha)) / (1000 * 60 * 60 * 24));
        
        if (diasDeuda > 15 && !cliente.categorias.includes('Alto Riesgo')) {
          toast.error(`Cliente ${cliente.nombre} tiene más de 15 días con deuda pendiente`);
          const clientesActualizados = clientes.map(c => 
            c.id === cliente.id ? { ...c, categorias: [...c.categorias, 'Alto Riesgo'] } : c
          );
          setClientes(clientesActualizados);
        }
      }
    });
  }, [clientesFiltrados, ventas, clientes]);

  const formatValue = (value) => {
    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? '0.00' : numericValue.toFixed(2);
  };

  const handleChangeCategoria = (e) => {
    const { value } = e.target;
    setCliente(prev => ({
      ...prev,
      categorias: value
    }));
  };

  const manejarCambioPagina = (evento, valor) => {
    setPagina(valor);
  };

  const manejarCambioPorPagina = (evento) => {
    setPorPagina(evento.target.value);
    setPagina(1);
  };

  console.log(cliente);

  const categorias = cliente.categorias || [];

  const handleAbonarSaldo = (ventaActualizada) => {
    setVentasCliente(prev => 
      prev.map(v => v._id === ventaActualizada._id ? ventaActualizada : v)
    );
  };

  const calcularDeudaTotal = (ventas) => {
    const total = ventas.reduce((acc, venta) => acc + (venta.saldoPendiente || 0), 0);
    setDeudaTotal(total);
  };

  useEffect(() => {
    calcularDeudaTotal(ventasCliente);
  }, [ventasCliente]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {!modoModal && (
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/dashboard')}
          sx={{ mb: 2 }}
          startIcon={<Dashboard />}
        >
          Ir al Dashboard
        </Button>
      )}

      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ 
            color: 'primary.main',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <AssignmentInd fontSize="large" /> Gestión de Clientes
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => setShowForm(!showForm)}
              startIcon={showForm ? <ExpandLess /> : <ExpandMore />}
              sx={{ borderRadius: 2 }}
            >
              {showForm ? 'Ocultar Formulario' : 'Nuevo Cliente'}
            </Button>
          </Box>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <TextField
            label="Buscar cliente"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            fullWidth
            InputProps={{
              startAdornment: <PersonSearch sx={{ color: 'action.active', mr: 1 }} />
            }}
          />
          
          <TextField
            select
            label="Municipio"
            value={filtroMunicipio}
            onChange={(e) => setFiltroMunicipio(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todos</MenuItem>
            {[...new Set(clientes.map(c => c.municipio))].map(municipio => (
              <MenuItem key={municipio} value={municipio}>
                {municipio}
              </MenuItem>
            ))}
          </TextField>
          
          <TextField
            select
            label="Categoría"
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {[...new Set(clientes.flatMap(c => c.categorias))].map(categoria => (
              <MenuItem key={categoria} value={categoria}>
                {categoria}
              </MenuItem>
            ))}
          </TextField>
          
          <Button 
            variant="outlined" 
            onClick={() => {
              setFiltroMunicipio('');
              setFiltroCategoria('');
            }}
          >
            Limpiar Filtros
          </Button>
        </Box>

        <Collapse in={showForm || modoModal}>
          <Paper elevation={1} sx={{ p: 3, mb: 4, backgroundColor: 'white' }}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Nombre Completo"
                    name="nombre"
                    value={cliente.nombre}
                    onChange={handleChange}
                    fullWidth
                    required
                    error={!!errores.nombre}
                    helperText={errores.nombre}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={3}>
                      <FormControl fullWidth>
                        <InputLabel>Prefijo</InputLabel>
                        <Select
                          value={prefijoRif}
                          onChange={(e) => setPrefijoRif(e.target.value)}
                          label="Prefijo"
                        >
                          <MenuItem value="V">Venezolano (V)</MenuItem>
                          <MenuItem value="E">Extranjero (E)</MenuItem>
                          <MenuItem value="J">Jurídico (J)</MenuItem>
                          <MenuItem value="G">Gubernamental (G)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={9}>
                      <TextField
                        label="Número de Cédula o RIF"
                        value={cliente.rif || ''}
                        onChange={(e) => setCliente(prev => ({ ...prev, rif: e.target.value }))}
                        fullWidth
                        required
                        error={!!errores.rif}
                        helperText={errores.rif}
                        inputProps={{
                          maxLength: 9,
                          pattern: '^[0-9]{8,9}$'
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <FormControl fullWidth>
                        <InputLabel>Prefijo</InputLabel>
                        <Select
                          value={prefijoTelefono}
                          onChange={(e) => setPrefijoTelefono(e.target.value)}
                          label="Prefijo"
                        >
                          <MenuItem value="0412">0412</MenuItem>
                          <MenuItem value="0426">0426</MenuItem>
                          <MenuItem value="0424">0424</MenuItem>
                          <MenuItem value="0416">0416</MenuItem>
                          <MenuItem value="0414">0414</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={8}>
                      <TextField
                        label="Número de Teléfono"
                        value={cliente.telefono || ''}
                        onChange={(e) => setCliente(prev => ({ ...prev, telefono: e.target.value }))}
                        fullWidth
                        required
                        error={!!errores.telefono}
                        helperText={errores.telefono}
                        inputProps={{
                          maxLength: 7,
                          pattern: '^[0-9]{7}$'
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Email"
                    name="email"
                    value={cliente.email}
                    onChange={handleChange}
                    fullWidth
                    error={!!errores.email}
                    helperText={errores.email}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Dirección"
                    name="direccion"
                    value={cliente.direccion}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
                    error={!!errores.direccion}
                    helperText={errores.direccion}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Grid container spacing={2}>
                    <Grid item xs={8}>
                      <TextField
                        label="Municipio"
                        name="municipio"
                        value={cliente.municipio}
                        onChange={handleChange}
                        fullWidth
                        required
                        error={!!errores.municipio}
                        helperText={errores.municipio}
                      />
                    </Grid>
                    <Grid item xs={4}>
                      <TextField
                        label="Color"
                        type="color"
                        value={colorMunicipio}
                        onChange={handleChangeColorMunicipio}
                        fullWidth
                        InputLabelProps={{
                          shrink: true
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
                <Grid item xs={12} md={8}>
                  <FormGroup row>
                    {['Alto Riesgo', 'Agente Retención'].map(categoria => (
                      <FormControlLabel
                        key={categoria}
                        control={
                          <Checkbox
                            checked={categorias.includes(categoria)}
                            onChange={handleChangeCategoria}
                            name={categoria}
                          />
                        }
                        label={categoria}
                      />
                    ))}
                  </FormGroup>
                </Grid>
                <Grid item xs={12}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="success" 
                    size="large"
                    fullWidth
                    disabled={cargandoVentas}
                  >
                    {cargandoVentas ? <CircularProgress size={24} /> : (clienteEditando ? 'Actualizar Cliente' : 'Registrar Cliente')}
                  </Button>
                  {clienteEditando && (
                    <Button 
                      variant="outlined" 
                      color="secondary" 
                      size="large"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={handleCancelarEdicion}
                    >
                      Cancelar Edición
                    </Button>
                  )}
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Collapse>

        <Typography variant="h5" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssignmentInd /> Listado de Clientes
        </Typography>

        <TableContainer component={Paper}>
          <Table stickyHeader>
            <TableHead sx={{ backgroundColor: 'primary.main' }}>
              <TableRow>
                <TableCell sx={{ color: 'common.black', fontWeight: 'bold' }}>Nombre</TableCell>
                <TableCell sx={{ color: 'common.black', fontWeight: 'bold' }}>Contacto</TableCell>
                <TableCell sx={{ color: 'common.black', fontWeight: 'bold' }}>Dirección</TableCell>
                <TableCell sx={{ color: 'common.black', fontWeight: 'bold' }}>Municipio</TableCell>
                <TableCell sx={{ color: 'common.black', fontWeight: 'bold' }} align="center">Acciones</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {clientesFiltrados.map((cliente) => (
                <TableRow 
                  key={cliente._id}
                  hover
                  sx={{ 
                    '&:nth-of-type(odd)': { 
                      backgroundColor: 'action.hover' 
                    }
                  }}
                >
                  <TableCell>
                    <Typography 
                      fontWeight="medium"
                      sx={{
                        backgroundColor: (categorias || []).includes('Agente Retención') ? 
                          '#ffff10' : (categorias || []).includes('Alto Riesgo') ? 
                          '#ff0000' : 'inherit',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {cliente.nombre}
                    </Typography>
                    <Chip label={`CI: ${cliente.rif}`} size="small" color="info" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {cliente.telefono && <span>📞 {cliente.telefono}</span>}
                      {cliente.email && <span>✉️ {cliente.email}</span>}
                    </Box>
                  </TableCell>
                  <TableCell>{cliente.direccion}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        backgroundColor: cliente.municipioColor || 'inherit',
                        padding: '4px 8px',
                        borderRadius: '4px'
                      }}
                    >
                      {cliente.municipio}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton 
                      color="primary"
                      onClick={() => handleEditarCliente(cliente)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      color="error"
                      onClick={() => handleEliminarCliente(cliente._id)}
                    >
                      <Delete />
                    </IconButton>
                    <IconButton
                      color="info"
                      onClick={() => {
                        setClienteSeleccionado(cliente); // Asegurar cliente seleccionado
                        handleVerVentas(cliente);
                      }}
                      title="Ver Historial de Ventas"
                    >
                      <Receipt />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <FormControl variant="outlined" size="small">
            <InputLabel>Por página</InputLabel>
            <Select
              value={porPagina}
              onChange={manejarCambioPorPagina}
              label="Por página"
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={25}>25</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>

          <Pagination
            count={Math.ceil(totalClientes / porPagina)}
            page={pagina}
            onChange={manejarCambioPagina}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      </Paper>

      {mostrarDialogoVentas && (
        <RegistroClienteDialog
          open={mostrarDialogoVentas}
          onClose={() => setMostrarDialogoVentas(false)}
          clienteSeleccionado={clienteSeleccionado}
          ventasCliente={ventasCliente}
          deudaTotal={deudaTotal}
          handleAbonarSaldo={handleAbonarSaldo}
          cargando={cargandoVentas}
        />
      )}

      <Dialog open={mostrarModalVentas} onClose={() => setMostrarModalVentas(false)}>
        <DialogTitle>Ventas</DialogTitle>
        <DialogContent>
          {/* Contenido del diálogo */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarModalVentas(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>

      {cargando && <LinearProgress color="secondary" style={{margin: '1rem 0'}} />}
    </Container>
  );
};

export default RegistrarCliente;
