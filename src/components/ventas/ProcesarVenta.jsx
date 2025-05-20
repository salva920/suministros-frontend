import React, { useState, useEffect} from 'react';
import { 
  Container, Typography, Grid, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl, InputLabel, 
  Select, MenuItem, Box, Chip, Tabs, Tab, InputAdornment, Alert, Snackbar
} from '@mui/material';
import { 
  VpnKey, Dashboard
} from '@mui/icons-material';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmarPagoModal from './ConfirmarPagoModal';
import moment from 'moment';
import axios from 'axios';
import ListadoHistorialVentas from './ListadoHistorialVentas';
import { useNavigate } from 'react-router-dom';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

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
  const [state, setState] = useState({
    busquedaDni: '',
    cliente: null,
    productosVenta: [],
    productos: [],
    clientes: [],
    clientesFiltrados: [],
    mostrarModalPago: false,
    metodoPago: 'efectivo',
    tipoPago: 'contado',
    nrFactura: '',
    banco: '',
    montoAbonar: '',
    showPrecios: false,
    pinDialog: false,
    pinInput: '',
    productoSeleccionado: null,
    cantidadInput: '',
    precioVentaInput: '',
    fechaVenta: new Date().toISOString().split('T')[0],
    error: null
  });

  

  const [tabValue, setTabValue] = useState(0);
  const [errorFecha, setErrorFecha] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const navigate = useNavigate();

  const [lotesProducto, setLotesProducto] = useState([]);
  const [loadingLotes, setLoadingLotes] = useState(false);

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    cargarDatosIniciales();
  }, []);

  const cargarDatosIniciales = async () => {
    try {
      const [productosRes, clientesRes] = await Promise.all([
        axios.get(`${API_URL}/productos`),
        axios.get(`${API_URL}/clientes?limit=1000`)
      ]);
      
      setState(prev => ({
        ...prev,
        productos: productosRes.data?.productos || [],
        clientes: clientesRes.data?.clientes || [],
        clientesFiltrados: clientesRes.data?.clientes || []
      }));
      
    } catch (error) {
      console.error('Error cargando datos iniciales:', error);
      toast.error('Error al cargar los datos iniciales');
    }
  };

  const filtrarClientes = () => {
    const term = state.busquedaDni.toLowerCase();
    const filtrados = state.clientes.filter(c => 
      c.rif?.toLowerCase().includes(term) || 
      c.nombre?.toLowerCase().includes(term)
    );
    setState(prev => ({ ...prev, clientesFiltrados: filtrados }));
  };


  const totalGeneral = state.productosVenta.reduce((total, producto) => {
    return total + (producto.precioVenta * producto.cantidad);
  }, 0);

  const handlePinSubmit = async () => {
    try {
      // Petición al backend para obtener la clave actual (nombre de ruta corregido)
      const response = await axios.get(`${API_URL}/unlock-key`);
      const claveActual = response.data.key;

      if (state.pinInput === claveActual) {
        setState(prev => ({
          ...prev,
          showPrecios: true,
          pinDialog: false,
          pinInput: ''
        }));
        toast.success('Campos desbloqueados');
      } else {
        toast.error('Clave incorrecta');
        setState(prev => ({ ...prev, pinInput: '' }));
      }
    } catch (error) {
      toast.error('Error al verificar la clave');
      setState(prev => ({ ...prev, pinInput: '' }));
    }
  };

  const handleSeleccionarProducto = async (producto) => {
    setLoadingLotes(true);
    try {
      const res = await axios.get(`${API_URL}/productos/${producto._id}/lotes`);
      let lotes = res.data.lotes || []; // Acceder a la propiedad lotes de la respuesta
      
      // Asegurarnos de que lotes sea un array
      if (!Array.isArray(lotes)) {
        lotes = [lotes].filter(Boolean); // Convertir a array si es un solo objeto
      }
      
      // Filtrar solo los lotes que tienen stock disponible
      lotes = lotes.filter(lote => lote && lote.stockLote > 0);
      
      if (lotes.length === 0) {
        toast.error('No hay lotes disponibles para este producto');
        setLotesProducto([]);
        return;
      }

      setLotesProducto(lotes);
      setState(prev => ({
        ...prev,
        productoSeleccionado: producto,
        cantidadInput: '',
        precioVentaInput: ''
      }));
    } catch (err) {
      console.error('Error al cargar lotes:', err);
      toast.error('Error al cargar lotes del producto');
      setLotesProducto([]);
    } finally {
      setLoadingLotes(false);
    }
  };

  const agregarProducto = async () => {
    if (!state.cantidadInput || state.cantidadInput < 1) {
      toast.error('Ingrese una cantidad válida');
      return;
    }

    if (lotesProducto.length === 0) {
      toast.error('No hay lotes disponibles');
      return;
    }

    const cantidad = parseInt(state.cantidadInput);
    let cantidadRestante = cantidad;
    let productosPorLote = [];
    let precioVenta = parseFloat(state.precioVentaInput);

    // Verificar si hay suficiente stock total
    const stockTotal = lotesProducto.reduce((total, lote) => total + lote.stockLote, 0);
    if (stockTotal < cantidad) {
      toast.error(`Solo hay ${stockTotal} unidades disponibles`);
      return;
    }

    for (const lote of lotesProducto) {
      if (cantidadRestante <= 0) break;
      const cantidadDeEsteLote = Math.min(lote.stockLote, cantidadRestante);
      
      if (cantidadDeEsteLote > 0) {
        productosPorLote.push({
          ...state.productoSeleccionado,
          cantidad: cantidadDeEsteLote,
          precioVenta: precioVenta,
          costoFinal: lote.costoFinal,
          gananciaUnitaria: parseFloat((precioVenta - lote.costoFinal).toFixed(2)),
          gananciaTotal: parseFloat(((precioVenta - lote.costoFinal) * cantidadDeEsteLote).toFixed(2)),
          loteId: lote._id
        });
        cantidadRestante -= cantidadDeEsteLote;
      }
    }

    if (cantidadRestante > 0) {
      toast.error('No hay suficiente stock en los lotes');
      return;
    }

    setState(prev => ({
      ...prev,
      productosVenta: [...prev.productosVenta, ...productosPorLote],
      productoSeleccionado: null,
      cantidadInput: '',
      precioVentaInput: ''
    }));
    setLotesProducto([]);
  };

  const finalizarVenta = async (formState) => {
    try {
      // Asegurar que solo se envíe el ID del cliente
      const clienteId = state.cliente?.id;

      if (!clienteId) {
        throw new Error('ID de cliente inválido');
      }

      // Calcular montos
      const totalVenta = totalGeneral;
      const montoAbonadoFinal = formState.tipoPago === 'contado' 
        ? totalVenta 
        : Number(formState.montoAbonar || 0);
      
      const saldoPendiente = totalVenta - montoAbonadoFinal;

      // Validar montos
      if (montoAbonadoFinal > totalVenta) {
        throw new Error('El monto abonado no puede ser mayor al total de la venta');
      }

      if (saldoPendiente < 0) {
        throw new Error('El saldo pendiente no puede ser negativo');
      }

      const ventaData = {
        fecha: formState.fechaVenta,
        cliente: clienteId,
        productos: state.productosVenta.map(p => ({
          producto: p._id,
          cantidad: p.cantidad,
          precioUnitario: p.precioVenta,
          costoInicial: p.costoFinal,
          gananciaUnitaria: p.gananciaUnitaria,
          gananciaTotal: p.gananciaTotal
        })),
        total: totalVenta,
        tipoPago: formState.tipoPago,
        metodoPago: formState.metodoPago,
        nrFactura: formState.nrFactura,
        banco: formState.metodoPago !== 'efectivo' ? formState.banco : undefined,
        montoAbonado: montoAbonadoFinal,
        saldoPendiente: saldoPendiente
      };

      console.log('Datos de la venta:', ventaData);

      const response = await axios.post(`${API_URL}/ventas`, ventaData);
      console.log('Venta creada:', response.data);

      // Limpiar el estado después de la venta
      setState(prev => ({
        ...prev,
        mostrarModalPago: false,
        productosVenta: [],
        cliente: null,
        busquedaDni: '',
        nrFactura: '',
        montoAbonar: ''
      }));

      toast.success('Venta registrada exitosamente!');
      
    } catch (error) {
      console.error('Error al finalizar la venta:', error);
      console.error('Respuesta de error:', error.response?.data);
      toast.error(error.response?.data?.error || error.message || 'Error al finalizar la venta');
    }
  };

  const seleccionarCliente = async (cliente) => {
    try {
      const response = await axios.get(`${API_URL}/ventas`, {
        params: {
          cliente: cliente.id,
          saldoPendiente: true
        }
      });

      const deudasPendientes = response.data.ventas;

      if (deudasPendientes.length > 0) {
        const montoTotalDeuda = deudasPendientes.reduce((total, venta) => total + venta.saldoPendiente, 0);

        setSnackbarMessage(
          `El cliente ${cliente.nombre} tiene ${deudasPendientes.length} deuda(s) pendiente(s) por un total de $${montoTotalDeuda.toFixed(2)}.`
        );
        setOpenSnackbar(true);
      }

      setState((prevState) => ({
        ...prevState,
        cliente,
      }));
    } catch (error) {
      console.error('Error al verificar deudas del cliente:', error);
      toast.error('Error al cargar deudas pendientes');
    }
  };

  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  const handleFinalizarVenta = () => {
    if (!state.cliente) {
      toast.error('Debes seleccionar un cliente antes de finalizar la venta.');
      return;
    }

    if (state.productosVenta.length === 0) {
      toast.error('Debes agregar al menos un producto antes de finalizar la venta.');
      return;
    }

    setState(prev => ({ ...prev, mostrarModalPago: true }));
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Botón para ir al Dashboard */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
        startIcon={<Dashboard />}
      >
        Ir al Dashboard
      </Button>

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

      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {/* Sección de Clientes */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Buscar Cliente (RIF o Nombre)"
                      value={state.busquedaDni}
                      onChange={(e) => {
                        setState(prev => ({ ...prev, busquedaDni: e.target.value }));
                        filtrarClientes();
                      }}
                      fullWidth
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Seleccionar Cliente</InputLabel>
                      <Select
                        value={state.cliente?.id || ''}
                        onChange={(e) => {
                          const clienteSeleccionado = state.clientesFiltrados.find(c => c.id === e.target.value);
                          if (clienteSeleccionado) seleccionarCliente(clienteSeleccionado);
                        }}
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 400,
                            },
                          },
                          anchorOrigin: {
                            vertical: 'bottom',
                            horizontal: 'left',
                          },
                          transformOrigin: {
                            vertical: 'top',
                            horizontal: 'left',
                          },
                        }}
                      >
                        {state.clientesFiltrados.map(cliente => (
                          <MenuItem 
                            key={cliente.id} 
                            value={cliente.id}
                            sx={{
                              whiteSpace: 'normal',
                              wordBreak: 'break-word',
                              py: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-start'
                            }}
                          >
                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                              {cliente.nombre}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              RIF: {cliente.rif}
                            </Typography>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Sección de Productos */}
            <Grid item xs={12} md={7}>
              <Paper sx={{ p: 2, height: 500, overflow: 'auto' }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell>Código</TableCell>
                        {state.showPrecios && <TableCell>Costo Final</TableCell>}
                        <TableCell>Stock</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {state.productos.map((producto) => (
                        <TableRow key={producto._id}>
                          <TableCell>{producto.nombre}</TableCell>
                          <TableCell>{producto.codigo}</TableCell>
                          {state.showPrecios && (
                            <TableCell>${producto.costoFinal?.toFixed(2)}</TableCell>
                          )}
                          <TableCell>
                            <Chip 
                              label={producto.stock} 
                              color={producto.stock > 5 ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="contained"
                              color="primary"
                              onClick={() => handleSeleccionarProducto(producto)}
                              disabled={producto.stock <= 0}
                            >
                              Agregar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            {/* Detalle de Venta */}
            <Grid item xs={12} md={5}>
              <Paper sx={{ p: 2, height: 500, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6">Detalle de Venta</Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<VpnKey />}
                    onClick={() => setState(prev => ({ ...prev, pinDialog: true }))}
                  >
                    Desbloquear Costos
                  </Button>
                </Box>
                
                <TableContainer sx={{ flex: 1 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Producto</TableCell>
                        <TableCell>Cantidad</TableCell>
                        <TableCell>P. Venta</TableCell>
                        <TableCell>Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {state.productosVenta.map((producto) => (
                        <TableRow key={producto._id}>
                          <TableCell>{producto.nombre}</TableCell>
                          <TableCell>{producto.cantidad}</TableCell>
                          <TableCell>${producto.precioVenta.toFixed(2)}</TableCell>
                          <TableCell>${(producto.precioVenta * producto.cantidad).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={3} align="right">Total General:</TableCell>
                        <TableCell>${totalGeneral.toFixed(2)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
                
                <Box sx={{ mt: 2, p: 2 }}>
                  <Button 
                    variant="contained" 
                    color="success" 
                    fullWidth
                    onClick={handleFinalizarVenta}
                    sx={{ height: 50 }}
                    disabled={state.productosVenta.length === 0}
                  >
                    Finalizar Venta
                  </Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <ListadoHistorialVentas handleVerCliente={(venta) => {
            console.log('Ver cliente:', venta.cliente);
          }} />
        </TabPanel>
      </Paper>

      {/* Modal de Cantidad y Precio */}
      <Dialog
        open={!!state.productoSeleccionado}
        onClose={() => {
          setState(prev => ({ ...prev, productoSeleccionado: null }));
          setLotesProducto([]);
        }}
      >
        <DialogTitle>Agregar Producto</DialogTitle>
        <DialogContent>
          {loadingLotes ? (
            <Typography>Cargando lotes...</Typography>
          ) : lotesProducto.length === 0 ? (
            <Typography color="error">No hay lotes disponibles para este producto.</Typography>
          ) : (
            <>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Lote seleccionado: 
                <b> {lotesProducto[0]?.fecha ? moment(lotesProducto[0].fecha).format('DD/MM/YYYY') : 'Sin fecha'} </b>
                | Costo: <b>${lotesProducto[0]?.costoFinal?.toFixed(2) || 'N/A'}</b>
                | Stock disponible: {lotesProducto[0]?.stockLote}
              </Typography>
              <Grid container spacing={2} sx={{ pt: 2 }}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={state.cantidadInput}
                    onChange={(e) => setState(prev => ({ ...prev, cantidadInput: e.target.value }))}
                    inputProps={{ 
                      min: 1, 
                      max: state.productoSeleccionado?.stock || 0 
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="Precio de Venta"
                    type="number"
                    value={state.precioVentaInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*\.?\d*$/.test(value)) {
                        setState(prev => ({ ...prev, precioVentaInput: value }));
                      }
                    }}
                    inputProps={{ 
                      min: lotesProducto[0]?.costoFinal || 0,
                      step: "0.01"
                    }}
                    error={state.precioVentaInput !== '' && isNaN(state.precioVentaInput)}
                    helperText={state.precioVentaInput !== '' && isNaN(state.precioVentaInput) 
                      ? 'Ingrese un número válido' 
                      : ''
                    }
                  />
                </Grid>
              </Grid>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setState(prev => ({ ...prev, productoSeleccionado: null }));
            setLotesProducto([]);
          }}>
            Cancelar
          </Button>
          <Button onClick={agregarProducto} color="primary">
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de PIN */}
      <Dialog
        open={state.pinDialog}
        onClose={() => setState(prev => ({ ...prev, pinDialog: false }))}
      >
        <DialogTitle>
          <VpnKey sx={{ mr: 1 }} />
          Ingrese el PIN de seguridad
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            type="password"
            label="PIN"
            value={state.pinInput}
            onChange={(e) => setState(prev => ({ ...prev, pinInput: e.target.value }))}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <VpnKey />
                </InputAdornment>
              )
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setState(prev => ({ ...prev, pinDialog: false }))}>
            Cancelar
          </Button>
          <Button onClick={handlePinSubmit} color="primary">
            Aceptar
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal de Confirmación de Pago */}
      <ConfirmarPagoModal
        open={state.mostrarModalPago}
        onClose={() => setState(prev => ({ ...prev, mostrarModalPago: false }))}
        fechaVenta={state.fechaVenta}
        setFechaVenta={(value) => setState(prev => ({ ...prev, fechaVenta: value }))}
        nrFactura={state.nrFactura}
        setNrFactura={(value) => setState(prev => ({ ...prev, nrFactura: value }))}
        tipoPago={state.tipoPago}
        setTipoPago={(value) => setState(prev => ({ ...prev, tipoPago: value }))}
        metodoPago={state.metodoPago}
        setMetodoPago={(value) => setState(prev => ({ ...prev, metodoPago: value }))}
        banco={state.banco}
        setBanco={(value) => setState(prev => ({ ...prev, banco: value }))}
        montoAbonar={state.montoAbonar}
        setMontoAbonar={(value) => setState(prev => ({ ...prev, montoAbonar: value }))}
        totalVenta={totalGeneral}
        errorFecha={errorFecha}
        setErrorFecha={(value) => setErrorFecha(value)}
        errorFactura={state.error}
        setErrorFactura={(value) => setState(prev => ({ ...prev, error: value }))}
        errorMonto={state.error}
        setErrorMonto={(value) => setState(prev => ({ ...prev, error: value }))}
        errorBanco={state.error}
        setErrorBanco={(value) => setState(prev => ({ ...prev, error: value }))}
        productosVenta={state.productosVenta}
        cliente={state.cliente}
        handleConfirmarPago={finalizarVenta}
      />

      <ToastContainer position="top-right" autoClose={3000} />

      {/* Notificación de deudas pendientes */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="warning" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProcesarVenta;