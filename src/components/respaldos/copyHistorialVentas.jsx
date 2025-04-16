import React, { useState, useEffect } from 'react';
import { 
  Container, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Typography, TextField, Button, Box, Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Grid, Pagination, IconButton, TableSortLabel, Stack
} from '@mui/material';
import { 
  History, Delete, AttachMoney, Receipt, ArrowUpward, ArrowDownward,
  DateRange, Search, Clear, Visibility, Print
} from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import GenerarFactura from './GenerarFactura';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const HistorialVentas = ({ ventas: ventasProp }) => {
  // Estados principales
  const [ventas, setVentas] = useState([]);
  const [ventasFiltradas, setVentasFiltradas] = useState([]);
  const [filtroDNI, setFiltroDNI] = useState('');
  const [mostrarFactura, setMostrarFactura] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarDeudas, setMostrarDeudas] = useState(false);
  const [mostrarModalAbono, setMostrarModalAbono] = useState(false);
  const [abonoActual, setAbonoActual] = useState(0);
  
  // Estados para paginación y ordenamiento
  const [pagina, setPagina] = useState(1);
  const [filasPorPagina] = useState(10);
  const [orden, setOrden] = useState('desc');
  const [columnaOrden, setColumnaOrden] = useState('fecha');
  
  // Estados para filtrado por fecha
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Nuevo estado para el modal y cliente seleccionado
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [ventasCliente, setVentasCliente] = useState(ventasProp || []);

  // Nuevo estado para el abono
  const [montoAbonar, setMontoAbonar] = useState(0);

  const navigate = useNavigate();

  // Nuevo estado para el total de deudas pendientes
  const [totalDeudas, setTotalDeudas] = useState(0);

  // Cargar ventas al montar el componente
  useEffect(() => {
    if (!ventasProp) {
      const ventasStorage = JSON.parse(localStorage.getItem('ventas')) || [];
      setVentasCliente(ventasStorage);
    }
  }, [ventasProp]);

  // Aplicar filtros y ordenamiento
  useEffect(() => {
    let resultado = [...ventasCliente];
    
    // Filtrar por DNI/RIF
    if (filtroDNI) {
      resultado = resultado.filter(venta => 
        venta.cliente?.dni?.toLowerCase().includes(filtroDNI.toLowerCase())
      );
    }
    
    // Filtrar por deudas pendientes
    if (mostrarDeudas) {
      resultado = resultado.filter(venta => venta.saldoPendiente > 0);
    }
    
    // Filtrar por rango de fechas
    if (fechaInicio && fechaFin) {
      resultado = resultado.filter(venta => {
        const fechaVenta = moment(venta.fecha);
        return fechaVenta.isBetween(fechaInicio, fechaFin, 'day', '[]');
      });
    }
    
    // Ordenar
    resultado.sort((a, b) => {
      if (columnaOrden === 'fecha') {
        return orden === 'asc' 
          ? new Date(a.fecha) - new Date(b.fecha)
          : new Date(b.fecha) - new Date(a.fecha);
      }
      if (columnaOrden === 'total') {
        return orden === 'asc' ? a.total - b.total : b.total - a.total;
      }
      return 0;
    });
    
    setVentasFiltradas(resultado);
    setPagina(1); // Resetear a primera página al cambiar filtros
  }, [ventasCliente, filtroDNI, mostrarDeudas, fechaInicio, fechaFin, orden, columnaOrden]);

  // Calcular ventas para la página actual
  const indiceUltimaFila = pagina * filasPorPagina;
  const indicePrimeraFila = indiceUltimaFila - filasPorPagina;
  const ventasPagina = ventasFiltradas.slice(indicePrimeraFila, indiceUltimaFila);
  const totalPaginas = Math.ceil(ventasFiltradas.length / filasPorPagina);

  // Función para cambiar ordenamiento
  const handleOrdenar = (columna) => {
    const esAsc = columnaOrden === columna && orden === 'asc';
    setOrden(esAsc ? 'desc' : 'asc');
    setColumnaOrden(columna);
  };

  // Función para limpiar filtros de fecha
  const limpiarFiltrosFecha = () => {
    setFechaInicio('');
    setFechaFin('');
  };

  // Función para eliminar todo el historial
  const handleLimpiarHistorial = () => {
    const confirmar = window.confirm('¿Estás seguro de eliminar todo el historial de ventas?');
    if (confirmar) {
      localStorage.removeItem('ventas');
      setVentasCliente([]);
      toast.success('Historial eliminado');
    }
  };

  // Función para manejar abonos
  const handleAbonar = (venta) => {
    setVentaSeleccionada(venta);
    setAbonoActual(Math.min(venta.saldoPendiente, venta.saldoPendiente)); // Sugerir el saldo pendiente
    setMostrarModalAbono(true);
  };

  // Función para confirmar abono
  const handleConfirmarAbono = () => {
    const ventasActualizadas = ventasCliente.map(venta => {
      if (venta.id === ventaSeleccionada.id) {
        const nuevoAbonado = (venta.montoAbonado || 0) + abonoActual;
        const nuevoSaldo = venta.total - nuevoAbonado;
        
        // Registrar el abono en el historial
        const abonos = [...(venta.abonos || []), {
          fecha: new Date().toISOString(),
          monto: abonoActual,
          saldoAnterior: venta.saldoPendiente,
          saldoNuevo: nuevoSaldo
        }];
        
        return {
          ...venta,
          montoAbonado: nuevoAbonado,
          saldoPendiente: nuevoSaldo,
          abonos,
          estado: nuevoSaldo > 0 ? 'pendiente' : 'pagado'
        };
      }
      return venta;
    });

    // Actualizar estado y localStorage
    setVentasCliente(ventasActualizadas);
    localStorage.setItem('ventas', JSON.stringify(ventasActualizadas));
    setMostrarModalAbono(false);
    toast.success(`Abono de $${abonoActual.toFixed(2)} registrado`);
  };

  // Función corregida para manejar ventas sin cliente
  const handleVerCliente = (cliente) => {
    const ventasGuardadas = JSON.parse(localStorage.getItem('ventas')) || [];
    
    // Filtrar ventas con cliente válido
    const ventasDelCliente = ventasGuardadas.filter(v => 
      v.cliente && v.cliente.rif === cliente.rif
    );
    
    setClienteSeleccionado(cliente);
    setVentasCliente(ventasDelCliente);
    setMostrarModalCliente(true);
  };

  // Calcular deuda total
  const deudaTotal = ventasCliente.reduce(
    (total, venta) => total + (venta.saldoPendiente || 0),
    0
  );

  // Función para abonar al saldo
  const handleAbonarSaldo = (venta) => {
    const monto = venta.montoAbonar || montoAbonar;
    
    if (monto <= 0 || monto > venta.saldoPendiente) {
      toast.error('Monto inválido');
      return;
    }

    // Actualizar ventas
    const ventasActualizadas = ventasCliente.map(v => {
      if (v.id === venta.id) {
        const nuevoSaldo = v.saldoPendiente - monto;
        return {
          ...v,
          montoAbonado: v.montoAbonado + monto,
          saldoPendiente: nuevoSaldo,
          estado: nuevoSaldo > 0 ? 'Pendiente' : 'Pagado'
        };
      }
      return v;
    });

    // Actualizar clientes (para sincronizar deudas)
    const clientesStorage = JSON.parse(localStorage.getItem('clientes')) || [];
    const clienteIndex = clientesStorage.findIndex(c => c.rif === venta.cliente.rif);
    
    if (clienteIndex !== -1) {
      const clienteActualizado = {
        ...clientesStorage[clienteIndex],
        deudas: clientesStorage[clienteIndex].deudas.map(d => 
          d.ventaId === venta.id 
            ? { ...d, monto: d.monto - monto } 
            : d
        ).filter(d => d.monto > 0) // Eliminar deudas pagadas
      };
      
      clientesStorage[clienteIndex] = clienteActualizado;
      localStorage.setItem('clientes', JSON.stringify(clientesStorage));
    }

    // Actualizar localStorage y estado
    const todasLasVentas = JSON.parse(localStorage.getItem('ventas')) || [];
    const ventasActualizadasGlobal = todasLasVentas.map(v => {
      if (v.id === venta.id) {
        const nuevoSaldo = v.saldoPendiente - monto;
        return {
          ...v,
          montoAbonado: v.montoAbonado + monto,
          saldoPendiente: nuevoSaldo,
          estado: nuevoSaldo > 0 ? 'Pendiente' : 'Pagado'
        };
      }
      return v;
    });

    localStorage.setItem('ventas', JSON.stringify(ventasActualizadasGlobal));
    setVentasCliente(ventasActualizadas);
    setMontoAbonar(0);

    const nuevoSaldo = venta.saldoPendiente - monto;
    if (monto === venta.saldoPendiente) {
      toast.success(`¡Cliente solventado! Saldo pendiente: $${nuevoSaldo.toFixed(2)}`);
    } else {
      toast.success(`Abono de $${monto.toFixed(2)} registrado. Saldo pendiente: $${nuevoSaldo.toFixed(2)}`);
    }
  };

  const [ventaFactura, setVentaFactura] = useState(null);

  const handleImprimirFactura = (venta) => {
    setVentaFactura(venta);
    setMostrarFactura(true);
  };

  // Nuevo efecto para calcular el total de deudas pendientes
  useEffect(() => {
    const calcularTotalDeudas = () => {
      if (mostrarDeudas) {
        // Cuando el filtro de deudas está activo, calcular solo sobre las ventas filtradas
        return ventasFiltradas.reduce((total, venta) => total + (venta.saldoPendiente || 0), 0);
      } else {
        // Cuando no hay filtro, calcular sobre todas las ventas con deuda
        const ventasStorage = JSON.parse(localStorage.getItem('ventas')) || [];
        return ventasStorage
          .filter(v => v.saldoPendiente > 0)
          .reduce((acc, venta) => acc + venta.saldoPendiente, 0);
      }
    };
    
    setTotalDeudas(calcularTotalDeudas());
  }, [ventasFiltradas, mostrarDeudas]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Título y botones de navegación */}
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'primary.main',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          Historial de Ventas
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/ventas/procesar')}
          sx={{ mr: 2 }}
        >
          Nueva Venta
        </Button>
        <Button
          variant="contained"
          color="secondary"
          disabled
        >
          Historial de Ventas
        </Button>
      </Paper>

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
            <Button
              variant={mostrarDeudas ? "contained" : "outlined"}
              color="error"
              onClick={() => setMostrarDeudas(!mostrarDeudas)}
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
            
            <Button
              variant="outlined"
              color="error"
              onClick={handleLimpiarHistorial}
              startIcon={<Delete />}
            >
              Limpiar Historial
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
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: <DateRange sx={{ color: 'action.active', mr: 1 }} />
                }}
                sx={{ flex: 1 }}
              />
              
              <TextField
                label="Fecha Fin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: 1 }}
              />
              
              {(fechaInicio || fechaFin) && (
                <IconButton onClick={limpiarFiltrosFecha} color="error">
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
                  color: totalDeudas > 0 ? 'error.main' : 'success.main'
                }}>
                  ${totalDeudas.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Tabla de ventas */}
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
              {ventasPagina.length > 0 ? (
                ventasPagina.map((venta) => (
                  <TableRow key={venta.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{moment(venta.fecha).format('DD/MM/YYYY')}</span>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      {venta.cliente ? (
                        <Box>
                          <div>{venta.cliente.nombre}</div>
                          <Chip 
                            label={`${venta.cliente.rif?.charAt(0) || 'V'}-${venta.cliente.rif?.slice(1) || ''}`} 
                            size="small" 
                            sx={{ mt: 0.5 }}
                            color="info"
                          />
                        </Box>
                      ) : (
                        <Typography variant="body2" color="textSecondary">
                          Cliente no registrado
                        </Typography>
                      )}
                    </TableCell>
                    
                    <TableCell align="right" sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                      ${(Number(venta.total) || 0).toFixed(2)}
                    </TableCell>
                    
                    <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                      ${(Number(venta.montoAbonado) || 0).toFixed(2)}
                    </TableCell>
                    
                    <TableCell align="right" sx={{ 
                      fontFamily: 'monospace',
                      color: venta.saldoPendiente > 0 ? 'error.main' : 'success.main',
                      fontWeight: 'bold'
                    }}>
                      ${(Number(venta.saldoPendiente) || 0).toFixed(2)}
                    </TableCell>
                    
                    <TableCell>
                      <Chip 
                        label={venta.saldoPendiente > 0 ? 'Pendiente' : 'Pagado'} 
                        color={venta.saldoPendiente > 0 ? 'warning' : 'success'}
                        size="small"
                      />
                    </TableCell>
                    
                    <TableCell align="center" sx={{ minWidth: '120px' }}>
                      <IconButton 
                        color="primary"
                        onClick={() => handleVerCliente(venta.cliente)}
                        sx={{ 
                          '&:hover': { backgroundColor: 'primary.light' },
                          color: 'primary.main'
                        }}
                      >
                        <Visibility fontSize="small" />
                        <Typography variant="caption" sx={{ ml: 1 }}>Ver</Typography>
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="textSecondary">
                      No se encontraron ventas con los filtros aplicados
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Paginación */}
        {ventasFiltradas.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPaginas}
              page={pagina}
              onChange={(_, value) => setPagina(value)}
              color="primary"
              showFirstButton
              showLastButton
            />
          </Box>
        )}

       
      </Paper>

      {/* Diálogo para Generar Factura */}
      {mostrarFactura && (
        <GenerarFactura 
          venta={ventaFactura} 
          onClose={() => setMostrarFactura(false)}
        />
      )}

      {/* Diálogo para Registrar Abono */}
      <Dialog 
        open={mostrarModalAbono} 
        onClose={() => setMostrarModalAbono(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Registrar Abono
        </DialogTitle>
        
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6">
                Cliente: <strong>{ventaSeleccionada?.cliente?.nombre || 'No registrado'}</strong>
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                Total Venta: <strong>${(Number(ventaSeleccionada?.total) || 0).toFixed(2)}</strong>
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                Abonado: <strong>${(Number(ventaSeleccionada?.montoAbonado) || 0).toFixed(2)}</strong>
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Saldo Pendiente: 
                <strong style={{ 
                  color: ventaSeleccionada?.saldoPendiente > 0 ? 'red' : 'green',
                  marginLeft: '8px'
                }}>
                  ${(Number(ventaSeleccionada?.saldoPendiente) || 0).toFixed(2)}
                </strong>
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Monto del Abono"
                type="number"
                value={abonoActual}
                onChange={(e) => setAbonoActual(Number(e.target.value))}
                inputProps={{ 
                  min: 0,
                  max: ventaSeleccionada?.saldoPendiente || 0,
                  step: 0.01
                }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={() => setAbonoActual(ventaSeleccionada?.saldoPendiente || 0)}
                sx={{ mt: 1 }}
              >
                Pagar Totalidad (${(Number(ventaSeleccionada?.saldoPendiente) || 0).toFixed(2)})
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMostrarModalAbono(false)}>Cancelar</Button>
          <Button 
            onClick={handleConfirmarAbono} 
            variant="contained" 
            color="success"
            disabled={abonoActual <= 0 || abonoActual > (Number(ventaSeleccionada?.saldoPendiente) || 0)}
          >
            Registrar Abono
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo para Ver Registro Completo */}
      <Dialog 
        open={mostrarModalCliente} 
        onClose={() => setMostrarModalCliente(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Registro Completo - {clienteSeleccionado?.nombre}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>RIF:</strong> {clienteSeleccionado?.rif}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Teléfono:</strong> {clienteSeleccionado?.telefono}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Email:</strong> {clienteSeleccionado?.email}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Dirección:</strong> {clienteSeleccionado?.direccion}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1">
                <strong>Municipio:</strong> {clienteSeleccionado?.municipio}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" sx={{ mt: 2 }}>
                Historial de Ventas
              </Typography>
              {ventasCliente.length > 0 ? (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Fecha</TableCell>
                        <TableCell>Total</TableCell>
                        <TableCell>Abonado</TableCell>
                        <TableCell>Saldo</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell>N° de Factura</TableCell>
                        <TableCell>Acciones</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {ventasCliente.map(venta => (
                        <TableRow key={venta.id}>
                          <TableCell>{new Date(venta.fecha).toLocaleDateString()}</TableCell>
                          <TableCell>${(Number(venta.total) || 0).toFixed(2)}</TableCell>
                          <TableCell>${(Number(venta.montoAbonado) || 0).toFixed(2)}</TableCell>
                          <TableCell sx={{ 
                            color: venta.saldoPendiente > 0 ? 'error.main' : 'success.main',
                            fontWeight: 'bold'
                          }}>
                            ${(Number(venta.saldoPendiente) || 0).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={venta.saldoPendiente > 0 ? 'Pendiente' : 'Pagado'} 
                              color={venta.saldoPendiente > 0 ? 'warning' : 'success'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{venta.nrFactura}</TableCell>
                          <TableCell>
                            {venta.saldoPendiente > 0 && (
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <TextField
                                  type="number"
                                  size="small"
                                  value={montoAbonar || ''}
                                  onChange={(e) => setMontoAbonar(Number(e.target.value))}
                                  sx={{ width: '100px' }}
                                  inputProps={{ min: 0, max: venta.saldoPendiente }}
                                />
                                <Button 
                                  variant="contained" 
                                  size="small"
                                  onClick={() => handleAbonarSaldo(venta)}
                                >
                                  Abonar
                                </Button>
                                <Button 
                                  variant="contained" 
                                  color="success" 
                                  size="small"
                                  onClick={() => handleAbonarSaldo({ ...venta, montoAbonar: venta.saldoPendiente })}
                                >
                                  Solventar
                                </Button>
                              </Box>
                            )}
                          </TableCell>
                          <TableCell>
                            <IconButton 
                              color="primary" 
                              onClick={() => handleImprimirFactura(venta)}
                            >
                              <Print />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography variant="body1" color="textSecondary" sx={{ py: 3 }}>
                  No hay ventas registradas para este cliente
                </Typography>
              )}
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
                <Typography variant="h6">
                  Deuda Total: 
                  <span style={{ 
                    color: deudaTotal > 0 ? 'red' : 'green',
                    marginLeft: '8px'
                  }}>
                    ${deudaTotal.toFixed(2)}
                  </span>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMostrarModalCliente(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default HistorialVentas;