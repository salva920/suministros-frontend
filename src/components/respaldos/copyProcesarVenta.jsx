import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, Typography, Grid, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, 
  Select, MenuItem, Box, Chip, Divider, List, ListItem, ListItemText, Tabs, Tab, IconButton 
} from '@mui/material';
import { AddShoppingCart, Delete, PersonSearch, AssignmentInd, PersonAdd, Inventory2, ReceiptLong, History, CheckCircle, Inventory, Dashboard } from '@mui/icons-material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { TasaCambioContext } from '../../context/TasaCambioContext';
import GenerarFactura from './GenerarFactura';
import RegistrarCliente from '../clientes/RegistrarCliente';
import moment from 'moment';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

const ProcesarVenta = () => { 
  const [mostrarRegistro, setMostrarRegistro] = useState(false);
  const [busquedaDni, setBusquedaDni] = useState('');
  const [ventas, setVentas] = useState([]);
  const [cliente, setCliente] = useState(null);
  const [productosVenta, setProductosVenta] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const { tasaPromedio } = useContext(TasaCambioContext);
  const navigate = useNavigate();
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [ventaFactura, setVentaFactura] = useState(null);
  const [clientesFiltrados, setClientesFiltrados] = useState([]);
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  const [tipoPago, setTipoPago] = useState('contado');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [banco, setBanco] = useState('');
  const [montoAbonar, setMontoAbonar] = useState('');
  const [totalVenta, setTotalVenta] = useState(0);
  const [tabValue, setTabValue] = useState(0);
  const [nrFactura, setNrFactura] = useState('');
  const [productosConInput, setProductosConInput] = useState({});
  const [fechaVenta, setFechaVenta] = useState(new Date().toISOString().split('T')[0]); // Fecha actual por defecto
  const [errorFecha, setErrorFecha] = useState('');
  const [errorFactura, setErrorFactura] = useState('');
  const [errorMonto, setErrorMonto] = useState('');
  const [errorBanco, setErrorBanco] = useState('');

  // Calcular el monto abonado final y el saldo pendiente
  const montoAbonadoFinal = tipoPago === 'contado' ? totalVenta : Number(montoAbonar);
  const saldoPendiente = totalVenta - montoAbonadoFinal;
  const esPagoContado = tipoPago === 'contado';

  // Cargar historial de ventas, productos y clientes al montar el componente
  useEffect(() => {
    const ventasStorage = JSON.parse(localStorage.getItem('ventas')) || [];
    const productosStorage = JSON.parse(localStorage.getItem('productos')) || [];
    const clientesStorage = JSON.parse(localStorage.getItem('clientes')) || [];
    
    // Generar IDs únicos usando un prefijo y timestamp
    const productosConIds = productosStorage.map((p, index) => ({
      ...p,
      id: p.id || `prod-${Date.now()}-${index}`
    }));
    
    setVentas(ventasStorage);
    setProductos(productosConIds);
    setClientes(clientesStorage);
  }, []);

  // Efecto para filtrar clientes en tiempo real
  useEffect(() => {
    const filtrarClientes = () => {
      if (!busquedaDni) {
        setClientesFiltrados(clientes);
        setCliente(null);
        return;
      }
      
      const filtrados = clientes.filter(c => 
        c.rif.toLowerCase().includes(busquedaDni.toLowerCase()) ||
        c.nombre.toLowerCase().includes(busquedaDni.toLowerCase())
      );
      
      setClientesFiltrados(filtrados);

      // Autoselección si hay coincidencia exacta en el RIF
      const clienteExacto = clientes.find(c => c.rif === busquedaDni);
      if (clienteExacto) setCliente(clienteExacto);
    };
    
    filtrarClientes();
  }, [busquedaDni, clientes]);

  // Actualizar clientes filtrados al cargar
  useEffect(() => {
    setClientesFiltrados(clientes);
  }, [clientes]);

  // Función para calcular el total de la venta
  const calcularTotalVenta = () => {
    return productosVenta.reduce((total, item) => {
      return total + (Number(item.precio) || 0) * (item.cantidad || 0);
    }, 0); // Valor inicial: 0
  };

  // Función para guardar la venta en el historial
  const guardarVentaEnHistorial = (venta) => {
    const ventasGuardadas = JSON.parse(localStorage.getItem('ventas')) || [];
    localStorage.setItem('ventas', JSON.stringify([...ventasGuardadas, venta]));
  };

  // Finalizar venta
  const handleFinalizarVenta = () => {
    if (productosVenta.length === 0) {
      toast.error('No hay productos en la venta');
      return;
    }

    setTotalVenta(calcularTotalVenta());
    setMostrarModalPago(true);
  };

  const handleClienteRegistrado = (nuevoCliente) => {
    setCliente(nuevoCliente);
    setBusquedaDni(nuevoCliente.rif);
  };

  const handleAgregarProducto = (producto, cantidad, precioUnitario) => {
    const productoExistente = productosVenta.find(p => p.id === producto.id);
    
    if (cantidad <= 0 || cantidad > producto.stock) {
      toast.error('Cantidad inválida o insuficiente stock');
      return;
    }

    if (precioUnitario <= 0) {
      toast.error('Ingrese un precio unitario válido');
      return;
    }

    if (productoExistente) {
      setProductosVenta(prev => prev.map(p => 
        p.id === producto.id ? { ...p, cantidad, precio: precioUnitario } : p
      ));
    } else {
      setProductosVenta([...productosVenta, { ...producto, cantidad, precio: precioUnitario }]);
    }

    // Limpiar los campos de cantidad y precio unitario
    setProductosConInput(prev => ({
      ...prev,
      [producto.id]: { cantidad: 1, precioUnitario: '' }
    }));
  };

  const handleEliminarProducto = (producto) => {
    setProductosVenta(prev => prev.filter(p => p.id !== producto.id));
    toast.success('Producto eliminado de la venta');
  };

  const handleSeleccionCliente = (e) => {
    const clienteSeleccionado = clientesFiltrados.find(c => c.id === e.target.value);
    setCliente(clienteSeleccionado);
    if (clienteSeleccionado) {
      setBusquedaDni(clienteSeleccionado.rif);
      verificarDeudaCliente(clienteSeleccionado);
    }
  };

  // Función para calcular el precio en Bs usando la tasa promedio
  const calcularPrecioBs = (precioDolares) => {
    return (precioDolares * tasaPromedio).toFixed(2);
  };

  const handleGenerarFactura = (venta) => {
    setVentaFactura(venta);
    setMostrarFactura(true);
  };

  // Modificar la función de confirmar pago para descontar el inventario solo al finalizar la venta
  const handleConfirmarPago = () => {
    if (!cliente || productosVenta.length === 0) {
      toast.error('Seleccione un cliente y agregue productos a la venta');
      return;
    }

    // Calcular el total de la venta
    const totalVenta = productosVenta.reduce((total, producto) => {
      return total + (producto.precio * producto.cantidad);
    }, 0);

    // Calcular el monto abonado final y el saldo pendiente
    const montoAbonadoFinal = tipoPago === 'contado' ? totalVenta : Number(montoAbonar) || 0;
    const saldoPendiente = totalVenta - montoAbonadoFinal;
    const esPagoContado = tipoPago === 'contado';

    // Crear la nueva venta
    const nuevaVenta = {
      id: Date.now(),
      fecha: moment(fechaVenta).format('YYYY-MM-DD'), // Guarda la fecha exacta
      cliente: {
        rif: cliente.rif,
        nombre: cliente.nombre,
        direccion: cliente.direccion,
        telefono: cliente.telefono,
        email: cliente.email,
        nrFactura
      },
      productos: productosVenta.map(producto => ({
        ...producto,
        costoFinal: producto.costoFinal,
        precioUnitario: producto.precio,
      })),
      total: totalVenta,
      tipoPago,
      metodoPago,
      banco,
      montoAbonado: montoAbonadoFinal,
      saldoPendiente,
      estado: esPagoContado ? 'Pagado' : saldoPendiente > 0 ? 'Pendiente' : 'Pagado',
      nrFactura
    };

    // Registrar la venta en el localStorage bajo la clave 'ventas'
    const ventasStorage = JSON.parse(localStorage.getItem('ventas')) || [];
    localStorage.setItem('ventas', JSON.stringify([nuevaVenta, ...ventasStorage]));

    // Registrar la salida en el localStorage bajo la clave 'salidas'
    const salidasStorage = JSON.parse(localStorage.getItem('salidas')) || [];
    const nuevasSalidas = productosVenta.map(producto => ({
      fechaHora: fechaVenta, // Usar la fecha seleccionada
      producto: producto.nombre,
      cantidad: producto.cantidad,
      proveedor: cliente.nombre, // Usar el nombre del cliente como proveedor
      precioUnitario: producto.precio,
      total: producto.precio * producto.cantidad,
      gananciaUnitaria: (producto.precio - producto.costoFinal) || 0, // Calcular la ganancia unitaria
      gananciaTotal: ((producto.precio - producto.costoFinal) * producto.cantidad) || 0, // Calcular la ganancia total
      nrFactura: nrFactura
    }));
    localStorage.setItem('salidas', JSON.stringify([...nuevasSalidas, ...salidasStorage]));

    // Actualizar el stock de los productos en el inventario
    const productosStorage = JSON.parse(localStorage.getItem('productos')) || [];
    const nuevosProductos = productosStorage.map(producto => {
      const productoVendido = productosVenta.find(p => p.id === producto.id);
      if (productoVendido) {
        return {
          ...producto,
          stock: producto.stock - productoVendido.cantidad, // Descontar la cantidad vendida
        };
      }
      return producto;
    });

    localStorage.setItem('productos', JSON.stringify(nuevosProductos));
    setProductos(nuevosProductos);

    // Limpiar el estado de la venta
    setProductosVenta([]);
    setCliente(null);
    setMontoAbonar('');
    setMostrarModalPago(false);
    toast.success('Venta procesada correctamente');

    if (tipoPago === 'credito' && nuevaVenta.saldoPendiente > 0) {
      const clientesStorage = JSON.parse(localStorage.getItem('clientes')) || [];
      const clienteIndex = clientesStorage.findIndex(c => c.id === cliente.id);

      if (clienteIndex !== -1) {
        const clienteActualizado = {
          ...clientesStorage[clienteIndex],
          deudas: [
            ...(clientesStorage[clienteIndex].deudas || []),
            {
              monto: nuevaVenta.saldoPendiente,
              fecha: nuevaVenta.fecha,
              ventaId: nuevaVenta.id,
            },
          ],
        };

        clientesStorage[clienteIndex] = clienteActualizado;
        localStorage.setItem('clientes', JSON.stringify(clientesStorage));
      }
    }
  };

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1) {
      navigate('/ventas/historial'); // Redirigir al historial de ventas
    }
  };

  const procesarVenta = () => {
    // Lógica para procesar la venta
    const nuevaVenta = {
      fecha: new Date().toISOString(),
      productos: productosVenta, // Suponiendo que productosVenta es un array de productos
      total: calcularTotalVenta(), // Suponiendo que calcularTotalVenta() devuelve el total de la venta
      cliente: cliente, // Suponiendo que cliente es el cliente asociado a la venta
    };

    // Guardar la venta en el historial
    const historialVentas = JSON.parse(localStorage.getItem('historialVentas')) || [];
    historialVentas.push(nuevaVenta);
    localStorage.setItem('historialVentas', JSON.stringify(historialVentas));

    // Limpiar el estado o redirigir
    setProductosVenta([]); // Limpiar la lista de productos
    navigate('/ventas/historial'); // Redirigir al historial de ventas
  };

  const handleAbonarSaldo = (venta) => {
    const monto = Number(montoAbonar) || 0;
    
    if (monto < 0 || monto > venta.saldoPendiente) {
      toast.error('Monto inválido', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }

    const ventasActualizadas = ventas.map(v => 
      v.id === venta.id ? { 
        ...v, 
        montoAbonado: (v.montoAbonado || 0) + monto,
        saldoPendiente: v.saldoPendiente - monto
      } : v
    );

    const ventasGuardadas = JSON.parse(localStorage.getItem('ventas')) || [];
    const ventasTotales = ventasGuardadas.map(v => 
      v.id === venta.id ? { 
        ...v, 
        montoAbonado: (v.montoAbonado || 0) + monto,
        saldoPendiente: v.saldoPendiente - monto
      } : v
    );

    localStorage.setItem('ventas', JSON.stringify(ventasTotales));
    setVentas(ventasActualizadas);
    setMontoAbonar('');

    toast.success('Abono registrado correctamente', {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  };

  const calcularPrecioUnitario = (costoFinal, margenGanancia = 0.2) => {
    return costoFinal * (1 + margenGanancia); // Aplica un margen de ganancia del 20%
  };

  const handleCantidadChange = (productoId, cantidad) => {
    setProductosConInput(prev => ({
      ...prev,
      [productoId]: { ...prev[productoId], cantidad: Number(cantidad) }
    }));
  };

  const handlePrecioUnitarioChange = (productoId, precioUnitario) => {
    setProductosConInput(prev => ({
      ...prev,
      [productoId]: { ...prev[productoId], precioUnitario: Number(precioUnitario) }
    }));
  };

  const handleMontoAbonarChange = (e) => {
    setMontoAbonar(e.target.value);
  };

  const calcularGanancias = (productosVenta) => {
    return productosVenta.map(producto => ({
      ...producto,
      gananciaUnitaria: (producto.precio - producto.costoFinal) || 0,
      gananciaTotal: ((producto.precio - producto.costoFinal) * producto.cantidad) || 0
    }));
  };

  const verificarDeudaCliente = (clienteSeleccionado) => {
    if (!clienteSeleccionado) return;

    const ventasGuardadas = JSON.parse(localStorage.getItem('ventas')) || [];
    const deudaTotal = ventasGuardadas
      .filter(v => v.cliente?.rif === clienteSeleccionado.rif && v.saldoPendiente > 0)
      .reduce((total, venta) => total + venta.saldoPendiente, 0);

    if (deudaTotal > 0) {
      toast.warning(`Este cliente tiene una deuda pendiente de $${deudaTotal.toFixed(2)}`);
    } else {
      toast.success(`El cliente ${clienteSeleccionado.nombre} no tiene deudas.`);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Título y pestañas */}
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'primary.main',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          Procesar Venta
        </Typography>

        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
          aria-label="Pestañas de Procesar Venta"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            },
          }}
        >
          <Tab label="Nueva Venta" sx={{ fontWeight: 'bold' }} />
          <Tab label="Historial de Ventas" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Paper>

      {/* Contenido de las Pestañas */}
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
        <TabPanel value={tabValue} index={0}>
          {/* Botón para ir al dashboard */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/dashboard')}
            sx={{ mb: 2 }}
            startIcon={<Dashboard />}
          >
            Ir al Dashboard
          </Button>

          {/* Referencia del cambio diario */}
          <Box sx={{ mb: 2, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Tasa de Cambio Diario
            </Typography>
            <Typography variant="body1">
              1$ = {tasaPromedio} Bs
            </Typography>
          </Box>

          {/* Sección Principal - Proceso de Venta */}
          <Paper elevation={3} sx={{ p: 3, mb: 4, backgroundColor: '#f8f9fa' }}>
            <Typography variant="h4" gutterBottom sx={{ 
              color: 'primary.main',
              fontWeight: 'bold',
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}>
              <AddShoppingCart fontSize="large" /> Procesar Venta
            </Typography>

            <Grid container spacing={4}>
              {/* Buscador de Cliente */}
              <Grid item xs={12}>
                <Paper elevation={1} sx={{ p: 2, backgroundColor: 'white' }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        label="Buscar por Cédula/RIF"
                        value={busquedaDni}
                        onChange={(e) => setBusquedaDni(e.target.value)}
                        fullWidth
                        variant="outlined"
                        InputProps={{
                          startAdornment: <PersonSearch sx={{ color: 'action.active', mr: 1 }} />
                        }}
                      />
                      {busquedaDni && clientesFiltrados.length === 0 && (
                        <Button
                          variant="outlined"
                          color="secondary"
                          onClick={() => setMostrarRegistro(true)}
                          fullWidth
                          sx={{ mt: 2 }}
                          startIcon={<PersonAdd />}
                        >
                          Registrar Nuevo Cliente
                        </Button>
                      )}
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth variant="outlined">
                        <InputLabel>Seleccionar Cliente</InputLabel>
                        <Select
                          select
                          label="Seleccionar Cliente"
                          fullWidth
                          value={cliente?.id || ''}
                          onChange={handleSeleccionCliente}
                        >
                          {clientesFiltrados.map((cliente) => (
                            <MenuItem key={cliente.id} value={cliente.id}>
                              {cliente.nombre}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* Inventario de Productos */}
              <Grid item xs={12} md={7}>
                <Paper elevation={1} sx={{ p: 2, height: '500px', overflow: 'auto' }}>
                  <Typography variant="h5" 
                    sx={{ 
                      mb: 3,
                      pb: 1,
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                    <Inventory fontSize="large" /> Inventario Disponible
                  </Typography>
                  <TableContainer>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Producto</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Costo Final</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Precio Unitario</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Cantidad Disponible</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Cantidad a Vender</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 'bold', backgroundColor: 'background.paper' }}>Acciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {productos.map((producto) => {
                          const cantidad = productosConInput[producto.id]?.cantidad || '';
                          const precioUnitario = productosConInput[producto.id]?.precioUnitario || '';

                          return (
                            <TableRow key={producto.id} hover>
                              <TableCell>{producto.nombre}</TableCell>
                              <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                ${(Number(producto.costoFinal) || 0).toFixed(2)}
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={precioUnitario}
                                  onChange={(e) => handlePrecioUnitarioChange(producto.id, e.target.value)}
                                  sx={{ width: '100px' }}
                                  inputProps={{ min: 0 }}
                                />
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={producto.stock} variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={cantidad}
                                  onChange={(e) => handleCantidadChange(producto.id, e.target.value)}
                                  sx={{ width: '100px' }}
                                  inputProps={{ min: 1, max: producto.stock }}
                                  placeholder="Ingrese cantidad"
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  variant="contained"
                                  color="primary"
                                  onClick={() => handleAgregarProducto(producto, cantidad, precioUnitario)}
                                  disabled={producto.stock <= 0 || !precioUnitario || precioUnitario <= 0 || !cantidad || cantidad <= 0}
                                >
                                  Agregar
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Detalle de la Venta */}
              <Grid item xs={12} md={5}>
                <Paper elevation={1} sx={{ p: 2, height: '500px', display: 'flex', flexDirection: 'column' }}>
                  <Typography variant="h5" sx={{ 
                    mb: 3,
                    pb: 1,
                    borderBottom: '2px solid',
                    borderColor: 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}>
                    <ReceiptLong fontSize="large" /> Detalle de Venta
                  </Typography>
                  <TableContainer sx={{ flex: 1 }}>
                    <Table>
                      <TableBody>
                        {productosVenta.map((item, index) => (
                          <TableRow key={index} hover>
                            <TableCell>{item.nombre}</TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                              ${(parseFloat(item.precio) || 0).toFixed(2)}
                            </TableCell>
                            <TableCell align="right">
                              <Chip label={`x${item.cantidad}`} variant="outlined" />
                            </TableCell>
                            <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                              ${((parseFloat(item.precio) || 0) * item.cantidad).toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    backgroundColor: 'primary.light',
                    borderRadius: 1
                  }}>
                    <Typography variant="h6">Total:</Typography>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.dark' }}>
                        ${calcularTotalVenta().toFixed(2)}
                      </Typography>
                      <Typography variant="h6" sx={{ color: 'text.secondary' }}>
                        {calcularPrecioBs(calcularTotalVenta())} Bs
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleFinalizarVenta}
                    disabled={productosVenta.length === 0}
                    fullWidth
                    size="large"
                    sx={{ mt: 2, py: 2, borderRadius: 2 }}
                    startIcon={<CheckCircle />}
                  >
                    Finalizar Venta
                  </Button>
                </Paper>
              </Grid>
            </Grid>
          </Paper>

          {/* Diálogo para Registrar Cliente */}
          <Dialog open={mostrarRegistro} onClose={() => setMostrarRegistro(false)} maxWidth="md" fullWidth>
            <DialogTitle sx={{ pb: 0 }}>Complete la información del cliente</DialogTitle>
            <DialogContent>
              <RegistrarCliente 
                onClienteRegistrado={(nuevoCliente) => {
                  handleClienteRegistrado(nuevoCliente);
                }}
                dniPrecargado={busquedaDni}
                modoModal
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setMostrarRegistro(false)}>Cancelar</Button>
            </DialogActions>
          </Dialog>

          {/* Diálogo para Generar Factura */}
          {mostrarFactura && (
            <GenerarFactura 
              venta={ventaFactura} 
              onClose={() => setMostrarFactura(false)}
            />
          )}

          {/* ToastContainer para mostrar las notificaciones */}
          <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />

          {/* Modal de Confirmación de Pago */}
          <Dialog 
            open={mostrarModalPago} 
            onClose={() => setMostrarModalPago(false)} 
            maxWidth="sm" 
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
              Confirmar Método de Pago
            </DialogTitle>
            <DialogContent sx={{ pt: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Fecha de Venta"
                    type="date"
                    value={fechaVenta}
                    onChange={(e) => {
                      setFechaVenta(e.target.value);
                      setErrorFecha('');
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                    error={!!errorFecha}
                    helperText={errorFecha}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Número de Factura"
                    value={nrFactura}
                    onChange={(e) => {
                      setNrFactura(e.target.value);
                      setErrorFactura('');
                    }}
                    error={!!errorFactura}
                    helperText={errorFactura}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Pago</InputLabel>
                    <Select
                      value={tipoPago}
                      onChange={(e) => setTipoPago(e.target.value)}
                    >
                      <MenuItem value="contado">Contado</MenuItem>
                      <MenuItem value="credito">Crédito</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      label="Método de Pago"
                    >
                      <MenuItem value="efectivo">Efectivo</MenuItem>
                      <MenuItem value="transferencia">Transferencia</MenuItem>
                      <MenuItem value="pago_movil">Pago Móvil</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {metodoPago !== 'efectivo' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Banco"
                      value={banco}
                      onChange={(e) => {
                        setBanco(e.target.value);
                        setErrorBanco('');
                      }}
                      error={!!errorBanco}
                      helperText={errorBanco}
                    />
                  </Grid>
                )}

                {tipoPago === 'credito' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Monto Abonado"
                        type="number"
                        value={montoAbonar}
                        onChange={(e) => {
                          setMontoAbonar(e.target.value);
                          setErrorMonto('');
                        }}
                        placeholder="Ingrese el monto abonado"
                        inputProps={{ min: 0, max: totalVenta }}
                        error={!!errorMonto}
                        helperText={errorMonto}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Saldo Pendiente"
                        type="number"
                        value={totalVenta - (Number(montoAbonar) || 0)}
                        disabled
                      />
                    </Grid>
                  </>
                )}

                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ mb: 2 }}>Detalle de Ganancias</Typography>
                  <TableContainer component={Paper}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Producto</TableCell>
                          <TableCell align="right">Ganancia Unitaria</TableCell>
                          <TableCell align="right">Ganancia Total</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {calcularGanancias(productosVenta).map((producto, index) => (
                          <TableRow key={index}>
                            <TableCell>{producto.nombre}</TableCell>
                            <TableCell align="right">${producto.gananciaUnitaria.toFixed(2)}</TableCell>
                            <TableCell align="right">${producto.gananciaTotal.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setMostrarModalPago(false)}>Cancelar</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleConfirmarPago}
                disabled={!cliente || productosVenta.length === 0}
              >
                Confirmar Pago
              </Button>
            </DialogActions>
          </Dialog>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          {/* Contenido de Historial de Ventas */}
          <Typography variant="h6" gutterBottom>
            Historial de Ventas
          </Typography>
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default ProcesarVenta;