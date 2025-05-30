import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, 
  Typography, Chip, IconButton, Box, TableSortLabel, TextField, Grid, Button, Pagination, CircularProgress, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions 
} from '@mui/material';
import { 
  Visibility, ArrowUpward, ArrowDownward, Search, DateRange, Clear, AttachMoney, Delete, History, Print, Lock 
} from '@mui/icons-material';
import moment from 'moment';
import RegistroClienteDialog from './RegistroClienteDialog';
import { toast } from 'react-hot-toast';
import GenerarFactura from './GenerarFactura';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

const ListadoHistorialVentas = () => {
  const [ventas, setVentas] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalDeudas, setTotalDeudas] = useState(0);
  const [itemsPorPagina] = useState(10); // Número de filas por página
  const [columnaOrden, setColumnaOrden] = useState('fecha'); // Columna por la que se ordena
  const [orden, setOrden] = useState('asc'); // Orden de la columna
  const [filtroDNI, setFiltroDNI] = useState(''); // Filtro por DNI
  const [mostrarDeudas, setMostrarDeudas] = useState(false); // Mostrar deudas
  const [fechaInicio, setFechaInicio] = useState(null); // Filtro por fecha de inicio
  const [fechaFin, setFechaFin] = useState(null); // Filtro por fecha de fin
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [ventasCliente, setVentasCliente] = useState([]);
  const [mostrarRegistroCliente, setMostrarRegistroCliente] = useState(false);
  const [montoAbonar, setMontoAbonar] = useState(0);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarGenerarFactura, setMostrarGenerarFactura] = useState(false);
  const [cargando, setCargando] = useState(false); // Estado de carga
  const [showFinancials, setShowFinancials] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const timeoutId = useRef(null);

  // Añade la función al inicio del componente
  const formatearFechaSimple = (fechaString) => {
    if (!fechaString) return 'No disponible';
    try {
      // Forzar a UTC y mostrar solo la fecha
      const fecha = moment.utc(fechaString);
      if (!fecha.isValid()) return 'Fecha inválida';
      return fecha.format('DD/MM/YYYY');
    } catch (error) {
      return 'Error de formato';
    }
  };

  // Función para cargar ventas
  const cargarVentas = useCallback(async () => {
    setCargando(true);
    try {
      const response = await axios.get(`${API_URL}/ventas`, {
        params: {
          page: pagina,
          limit: itemsPorPagina,
          sort: columnaOrden,
          order: orden,
          cliente: filtroDNI,
          saldoPendiente: mostrarDeudas.toString(),
          fechaInicio: fechaInicio?.toISOString(),
          fechaFin: fechaFin?.toISOString()
        }
      });
      
      const ventasConCosto = response.data.ventas.map(venta => ({
        ...venta,
        costoFinal: venta.productos.reduce((total, p) => total + (p.precio * p.cantidad), 0)
      }));
      setVentas(ventasConCosto);
      setTotalPaginas(response.data.pages);
      setTotalDeudas(response.data.totales?.totalSaldoPendiente || 0);
    } catch (error) {
      console.error('Error cargando ventas:', error);
      toast.error('Error al cargar las ventas');
    } finally {
      setCargando(false);
    }
  }, [pagina, columnaOrden, orden, filtroDNI, mostrarDeudas, fechaInicio, fechaFin, itemsPorPagina]);

  // Efecto para cargar ventas cuando cambian los filtros
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPagina(1);
      cargarVentas();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [filtroDNI, mostrarDeudas, fechaInicio, fechaFin, columnaOrden, orden]);

  // Efecto separado para manejar cambios de página
  useEffect(() => {
    cargarVentas();
  }, [pagina]);

  // Función para actualizar una venta
  const actualizarVenta = async (ventaActualizada) => {
    try {
      console.log('Iniciando actualización de venta:', ventaActualizada);

      // Normalizar datos antes de enviar
      const datosActualizados = {
        _id: ventaActualizada._id,
        cliente: ventaActualizada.cliente?._id || ventaActualizada.cliente,
        total: parseFloat(ventaActualizada.total || 0),
        montoAbonado: parseFloat(ventaActualizada.montoAbonado || 0),
        saldoPendiente: parseFloat(ventaActualizada.saldoPendiente || 0),
        estadoCredito: ventaActualizada.estadoCredito,
        tipoPago: ventaActualizada.tipoPago,
        metodoPago: ventaActualizada.metodoPago,
        productos: ventaActualizada.productos?.map(p => ({
          producto: p.producto?._id || p.producto,
          cantidad: parseFloat(p.cantidad || 0),
          precioUnitario: parseFloat(p.precioUnitario || 0),
          gananciaUnitaria: parseFloat(p.gananciaUnitaria || 0),
          gananciaTotal: parseFloat(p.gananciaTotal || 0),
          costoInicial: parseFloat(p.costoInicial || 0)
        }))
      };

      console.log('Datos normalizados para enviar:', datosActualizados);

      const response = await axios.put(`${API_URL}/ventas/${ventaActualizada._id}`, datosActualizados);
      
      console.log('Respuesta del backend:', response.data);

      if (!response.data) {
        throw new Error('No se recibió respuesta del servidor');
      }

      // Actualizar ventas en el listado principal
      setVentas(prev => prev.map(v => 
        v._id === ventaActualizada._id ? response.data : v
      ));
      
      // Actualizar ventas del cliente en el diálogo
      setVentasCliente(prev => prev.map(v => 
        v._id === ventaActualizada._id ? response.data : v
      ));

      // Mostrar mensaje de éxito
      toast.success('Venta actualizada correctamente');
      
      return true;
    } catch (error) {
      console.error('Error actualizando venta:', error);
      console.error('Detalles del error:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        estado: error.response?.status
      });
      toast.error(error.response?.data?.error || 'Error al actualizar venta');
      return false;
    }
  };

  // Función para abonar saldo
  const handleAbonarSaldo = async (ventaActualizada) => {
    try {
      console.log('Iniciando abono de saldo:', ventaActualizada);
      const success = await actualizarVenta(ventaActualizada);
      
      if (success) {
        // Recargar las ventas para asegurar datos actualizados
        await cargarVentas();
      }
      
      return success;
    } catch (error) {
      console.error('Error en handleAbonarSaldo:', error);
      return false;
    }
  };

  // Función para manejar el orden de la tabla
  const handleOrdenar = (columna) => {
    const esAscendente = columnaOrden === columna && orden === 'asc';
    setOrden(esAscendente ? 'desc' : 'asc');
    setColumnaOrden(columna);
  };

  // Función para imprimir factura
  const handleImprimirFactura = (venta) => {
    setVentaSeleccionada(venta);
    setMostrarGenerarFactura(true);
  };

  // Función para manejar el clic en "Ver"
  const handleVerCliente = async (venta) => {
    try {
      setCargando(true);
      
      // Extraer y validar ID del cliente
      const clienteId = venta.cliente?._id?.toString() || venta.cliente;
      
      if (!clienteId) {
        toast.error('ID de cliente inválido');
        return;
      }

      // Obtener ventas con filtro estricto desde el backend
      const response = await axios.get(`${API_URL}/ventas`, {
        params: {
          cliente: clienteId,
          populate: 'cliente',
          limit: 100
        }
      });

      // Normalizar estructura de ventas
      const ventasFiltradas = response.data.ventas.map(v => ({
        ...v,
        _id: v._id?.toString(),
        cliente: {
          _id: v.cliente?._id?.toString(),
          nombre: v.cliente?.nombre || 'Cliente no disponible',
          rif: v.cliente?.rif || 'Sin RIF'
        },
        fecha: v.fecha ? new Date(v.fecha) : null,
        total: parseFloat(v.total || 0),
        montoAbonado: parseFloat(v.montoAbonado || 0),
        saldoPendiente: parseFloat(v.saldoPendiente || 0)
      }));

      // Normalizar datos del cliente
      const clienteNormalizado = {
        _id: clienteId,
        nombre: venta.cliente?.nombre || 'Cliente no disponible',
        rif: venta.cliente?.rif || 'Sin RIF',
        telefono: venta.cliente?.telefono || 'No disponible',
        email: venta.cliente?.email || 'No disponible',
        direccion: venta.cliente?.direccion || 'No disponible',
        municipio: venta.cliente?.municipio || 'No disponible'
      };

      setClienteSeleccionado(clienteNormalizado);
      setVentasCliente(ventasFiltradas);
      setMostrarRegistroCliente(true);
      
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar historial del cliente');
    } finally {
      setCargando(false);
    }
  };

  // Función para actualizar las ventas después de abonar o solventar
  const actualizarVentas = (ventaActualizada) => {
    setVentas(prevVentas => 
      prevVentas.map(v => 
        v._id === ventaActualizada._id ? ventaActualizada : v
      )
    );
  };

  // Función para manejar el desbloqueo
  const handlePasswordSubmit = async () => {
    try {
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

  return (
    <>
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
        {/* Encabezado y controles */}
        <Box sx={{ 
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: 2
          }}>
            <History fontSize="large" /> Historial de Ventas
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {!showFinancials && (
              <Button
                variant="outlined"
                startIcon={<Lock />}
                onClick={() => setPasswordDialogOpen(true)}
                sx={{ borderRadius: '25px', px: 3 }}
              >
                
              </Button>
            )}
            <Button
              variant={mostrarDeudas ? "contained" : "outlined"}
              color="error"
              onClick={() => {
                setMostrarDeudas(!mostrarDeudas);
                setPagina(1);
                setFiltroDNI('');
                setFechaInicio(null);
                setFechaFin(null);
              }}
              startIcon={<AttachMoney />}
              sx={{
                borderRadius: '8px',
                px: 3,
                py: 1,
                fontWeight: 'bold',
                boxShadow: mostrarDeudas ? '0px 2px 4px rgba(0,0,0,0.2)' : 'none',
                '&:hover': {
                  boxShadow: '0px 4px 8px rgba(0,0,0,0.2)'
                }
              }}
            >
              {mostrarDeudas ? 'Mostrar Todas' : 'Filtrar Deudas'}
            </Button>
          </Box>
        </Box>

        {/* Filtros */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {/* Columna 1: Búsqueda por RIF */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Buscar por Cédula/RIF"
              value={filtroDNI}
              onChange={(e) => setFiltroDNI(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'action.active', mr: 1 }} />
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'grey.300',
                  },
                  '&:hover fieldset': {
                    borderColor: 'primary.main',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: 'primary.main',
                  },
                }
              }}
            />
          </Grid>
          
          {/* Columna 2: Filtros por fecha */}
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Fecha Inicio"
                type="date"
                value={fechaInicio ? fechaInicio.toISOString().split('T')[0] : ''}
                onChange={(e) => setFechaInicio(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <DateRange sx={{ color: 'action.active', mr: 1 }} />
                }}
                sx={{
                  flex: 1
                }}
              />
              
              <TextField
                label="Fecha Fin"
                type="date"
                value={fechaFin ? fechaFin.toISOString().split('T')[0] : ''}
                onChange={(e) => setFechaFin(e.target.value ? new Date(e.target.value) : null)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              
              {(fechaInicio || fechaFin) && (
                <IconButton onClick={() => {
                  setFechaInicio(null);
                  setFechaFin(null);
                }} color="error">
                  <Clear />
                </IconButton>
              )}
            </Box>
          </Grid>
          
          {/* Columna 3: Total de deudas */}
          <Grid item xs={12} md={4}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 2,
              p: 2,
              height: '100%',
              backgroundColor: mostrarDeudas ? 'warning.light' : 'grey.100',
              borderRadius: 1,
              borderLeft: `4px solid ${mostrarDeudas ? 'warning.main' : 'grey.500'}`,
              transition: 'all 0.3s ease'
            }}>
              <AttachMoney sx={{ 
                color: mostrarDeudas ? 'warning.main' : 'text.secondary',
                fontSize: '2rem' 
              }} />
              <Box>
                <Typography variant="subtitle2" color="text.secondary">
                  {mostrarDeudas ? 'Total Deudas Filtradas' : 'Total Deudas Pendientes'}
                </Typography>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold',
                  color: (totalDeudas || 0) > 0 ? 'error.main' : 'success.main'
                }}>
                  ${(totalDeudas || 0).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Tabla de ventas */}
        {cargando ? (
          <CircularProgress />
        ) : (
          <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold', width: '200px' }}>
                    <TableSortLabel
                      active={columnaOrden === 'fecha'}
                      direction={orden}
                      onClick={() => handleOrdenar('fecha')}
                    >
                      Fecha y Hora
                      {columnaOrden === 'fecha' && (
                        orden === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Cliente</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Productos</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">
                    <TableSortLabel
                      active={columnaOrden === 'total'}
                      direction={orden}
                      onClick={() => handleOrdenar('total')}
                    >
                      Total
                      {columnaOrden === 'total' && (
                        orden === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />
                      )}
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Abonado</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Saldo</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {ventas.length > 0 ? (
                  ventas.map((venta) => (
                    <TableRow key={venta._id} hover>
                      <TableCell>
                        {formatearFechaSimple(venta.fecha)}
                      </TableCell>
                      <TableCell>
                        {venta.cliente ? (
                          <Box>
                            <div>{venta.cliente.nombre}</div>
                            <Chip 
                              label={venta.cliente.rif} 
                              size="small" 
                              sx={{ mt: 0.5 }}
                              color="info"
                            />
                          </Box>
                        ) : 'Cliente no registrado'}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          {venta.productos?.map((producto, index) => (
                            <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2">
                                {producto.producto?.nombre || 'Producto no disponible'}
                              </Typography>
                              <Chip 
                                label={showFinancials ? 
                                  `${producto.cantidad} x $${producto.precioUnitario}` : 
                                  `${producto.cantidad}`
                                }
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            </Box>
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">${(venta.total || 0).toFixed(2)}</TableCell>
                      <TableCell align="right">${(venta.montoAbonado || 0).toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ 
                        color: (venta.saldoPendiente || 0) > 0 ? 'error.main' : 'success.main',
                        fontWeight: 'bold'
                      }}>
                        ${(venta.saldoPendiente || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={(venta.saldoPendiente || 0) > 0 ? 'Pendiente' : 'Pagado'} 
                          color={(venta.saldoPendiente || 0) > 0 ? 'warning' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          onClick={() => handleVerCliente(venta)}
                          color="primary"
                        >
                          <Visibility />
                        </IconButton>
                        <IconButton 
                          onClick={() => handleImprimirFactura(venta)}
                          color="secondary"
                        >
                          <Print />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="textSecondary">
                        No se encontraron ventas con los filtros aplicados
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Paginación */}
        {totalPaginas > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPaginas}
              page={pagina}
              onChange={(_, value) => setPagina(value)}
              color="primary"
              showFirstButton
              showLastButton
              siblingCount={1}
              boundaryCount={1}
            />
          </Box>
        )}
      </Paper>

      {/* Modal de RegistroClienteDialog */}
      <RegistroClienteDialog
        open={mostrarRegistroCliente}
        onClose={() => setMostrarRegistroCliente(false)}
        clienteSeleccionado={clienteSeleccionado}
        ventasCliente={ventasCliente}
        deudaTotal={ventasCliente.reduce((sum, v) => sum + (v.saldoPendiente || 0), 0)}
        montoAbonar={montoAbonar}
        setMontoAbonar={setMontoAbonar}
        handleAbonarSaldo={(ventaActualizada) => {
          actualizarVentas(ventaActualizada);
        }}
        handleImprimirFactura={(venta) => {
          console.log('Imprimir factura:', venta);
        }}
      />

      {/* Modal de GenerarFactura */}
      {mostrarGenerarFactura && (
        <GenerarFactura
          venta={ventaSeleccionada}
          onClose={() => setMostrarGenerarFactura(false)}
        />
      )}

      {/* Modal de Desbloqueo */}
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
    </>
  );
};

export default ListadoHistorialVentas; 