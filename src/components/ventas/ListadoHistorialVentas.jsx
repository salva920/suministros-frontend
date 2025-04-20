import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, 
  Typography, Chip, IconButton, Box, TableSortLabel, TextField, Grid, Button, Pagination, CircularProgress 
} from '@mui/material';
import { 
  Visibility, ArrowUpward, ArrowDownward, Search, DateRange, Clear, AttachMoney, Delete, History, Print 
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
  const timeoutId = useRef(null);

  // Función para cargar ventas
  const cargarVentas = useCallback(async () => {
    setCargando(true); // Iniciar estado de carga
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
      setTotalDeudas(response.data.totalDeudas);
    } catch (error) {
      console.error('Error cargando ventas:', error);
    } finally {
      setCargando(false); // Finalizar estado de carga
    }
  }, [pagina, columnaOrden, orden, filtroDNI, mostrarDeudas, fechaInicio, fechaFin, itemsPorPagina]);

  // Cambiar el useEffect de carga de ventas
  useEffect(() => {
    cargarVentas();
  }, [cargarVentas]);

  // Usar debounce para búsquedas por RIF
  useEffect(() => {
    if (timeoutId.current) clearTimeout(timeoutId.current);
    
    timeoutId.current = setTimeout(() => {
      setPagina(1); // Reiniciar a la primera página al buscar
      cargarVentas(); // Llamar a la función de carga de ventas
    }, 500);

    return () => clearTimeout(timeoutId.current); // Limpiar el timeout al desmontar
  }, [filtroDNI, cargarVentas]);

  // Función para actualizar una venta
  const actualizarVenta = async (ventaActualizada) => {
    try {
      await axios.put(`${API_URL}/ventas/${ventaActualizada._id}`, ventaActualizada);
      const ventasActualizadas = ventas.map(v => 
        v._id === ventaActualizada._id ? ventaActualizada : v
      );
      setVentas(ventasActualizadas);
    } catch (error) {
      console.error('Error actualizando venta:', error);
    }
  };

  // Función para abonar saldo
  const handleAbonarSaldo = async (venta, monto) => {
    const ventaActualizada = {
      ...venta,
      montoAbonado: venta.montoAbonado + monto,
      saldoPendiente: venta.saldoPendiente - monto
    };
    await actualizarVenta(ventaActualizada);
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
      setCargando(true); // Añadir indicador de carga
      
      // Obtener todas las ventas del cliente
      const response = await axios.get(`${API_URL}/ventas`, {
        params: {
          cliente: venta.cliente._id,
          limit: 100 // Asegurar que se obtengan suficientes ventas
        }
      });
      
      console.log('Ventas del cliente:', response.data.ventas); // Agregar log para depuración
      
      if (!response.data.ventas || response.data.ventas.length === 0) {
        toast.info('El cliente no tiene ventas registradas');
      }
      
      setClienteSeleccionado(venta.cliente);
      setVentasCliente(response.data.ventas);
      setMostrarRegistroCliente(true);
    } catch (error) {
      console.error('Error al obtener ventas del cliente:', error);
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
            <Button
              variant={mostrarDeudas ? "contained" : "outlined"}
              color="error"
              onClick={() => {
                setMostrarDeudas(!mostrarDeudas);
                setPagina(1); // Reiniciar a la primera página
                setFiltroDNI(''); // Reiniciar filtro por RIF
                setFechaInicio(null); // Reiniciar fecha de inicio
                setFechaFin(null); // Reiniciar fecha de fin
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
                  color: totalDeudas > 0 ? 'error.main' : 'success.main'
                }}>
                  ${totalDeudas.toFixed(2)}
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
                        {moment.utc(venta.fecha).local().format('DD/MM/YYYY HH:mm')}
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
                      <TableCell align="right">${venta.total.toFixed(2)}</TableCell>
                      <TableCell align="right">${venta.montoAbonado.toFixed(2)}</TableCell>
                      <TableCell align="right" sx={{ 
                        color: venta.saldoPendiente > 0 ? 'error.main' : 'success.main',
                        fontWeight: 'bold'
                      }}>
                        ${venta.saldoPendiente.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={venta.saldoPendiente > 0 ? 'Pendiente' : 'Pagado'} 
                          color={venta.saldoPendiente > 0 ? 'warning' : 'success'}
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
    </>
  );
};

export default ListadoHistorialVentas; 