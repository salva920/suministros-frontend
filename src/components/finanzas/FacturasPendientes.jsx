import React, { useState, useEffect, useCallback } from 'react';
import {
  Container, Typography, Box, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Grid, MenuItem, InputAdornment, IconButton, Chip,
  Alert, CircularProgress, Divider, Tooltip, useTheme
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Money as MoneyIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  FileCopy as FileCopyIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { debounce } from 'lodash';

// URL de la API
const API_URL = "https://suministros-backend.vercel.app/api";

// Componentes estilizados
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'bold',
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
  }
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
    transition: 'background-color 0.3s ease',
  },
  // Cambiar el color si la factura está pagada
  '&.pagada': {
    backgroundColor: theme.palette.success.light,
    '&:hover': {
      backgroundColor: theme.palette.success.light,
    }
  }
}));

const FacturasPendientes = () => {
  const theme = useTheme();
  
  // Estados para manejar datos y UI
  const [facturas, setFacturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendientes');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  
  // Estados para modal de abono
  const [openAbonoModal, setOpenAbonoModal] = useState(false);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
  const [montoAbono, setMontoAbono] = useState('');
  const [errorAbono, setErrorAbono] = useState('');
  
  // Estados para modal de nueva factura
  const [openNuevaFacturaModal, setOpenNuevaFacturaModal] = useState(false);
  const [nuevaFactura, setNuevaFactura] = useState({
    concepto: '',
    proveedor: '',
    numeroFactura: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0]
  });
  
  // Función para formatear fecha de manera simple
  const formatearFechaSimple = (fechaString) => {
    if (!fechaString) return 'No disponible';
    
    try {
      const fecha = new Date(fechaString);
      if (isNaN(fecha.getTime())) return 'Fecha inválida';
      
      const dia = fecha.getDate();
      const mes = fecha.getMonth() + 1;
      const anio = fecha.getFullYear();
      
      return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${anio}`;
    } catch (error) {
      return 'Error de formato';
    }
  };
  
  // Función para formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES'
    }).format(valor);
  };
  
  // Cargar facturas pendientes con paginación
  const cargarFacturas = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page + 1, // API usa 1-indexed pages
        limit: rowsPerPage,
        estado: filtroEstado,
        busqueda
      });
      
      if (fechaDesde) params.append('fechaDesde', fechaDesde);
      if (fechaHasta) params.append('fechaHasta', fechaHasta);
      
      const response = await axios.get(`${API_URL}/facturas-pendientes?${params.toString()}`);
      
      setFacturas(response.data.facturas);
      setTotalItems(response.data.totalDocs);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error al cargar facturas pendientes:', error);
      toast.error('No se pudieron cargar las facturas pendientes');
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, filtroEstado, busqueda, fechaDesde, fechaHasta]);
  
  // Cargar facturas cuando cambien los filtros, página o límite
  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);
  
  // Búsqueda con debounce para evitar múltiples llamadas
  const debouncedSearch = useCallback(
    debounce((value) => {
      setBusqueda(value);
      setPage(0); // Volver a la primera página al buscar
    }, 500),
    []
  );
  
  // Manejar cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manejar cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Restablecer filtros
  const handleResetFiltros = () => {
    setBusqueda('');
    setFiltroEstado('pendientes');
    setFechaDesde('');
    setFechaHasta('');
    setPage(0);
  };
  
  // Abrir modal de abono
  const handleOpenAbonoModal = (factura) => {
    setFacturaSeleccionada(factura);
    setMontoAbono('');
    setErrorAbono('');
    setOpenAbonoModal(true);
  };
  
  // Registrar abono
  const handleRegistrarAbono = async () => {
    // Validaciones
    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) {
      setErrorAbono('El monto debe ser un número positivo');
      return;
    }
    
    if (monto > facturaSeleccionada.saldo) {
      setErrorAbono('El abono no puede ser mayor al saldo pendiente');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/facturas-pendientes/${facturaSeleccionada._id}/abonos`, {
        monto
      });
      
      toast.success('Abono registrado correctamente');
      setOpenAbonoModal(false);
      cargarFacturas(); // Recargar para ver cambios
    } catch (error) {
      console.error('Error al registrar abono:', error);
      toast.error('No se pudo registrar el abono');
    } finally {
      setLoading(false);
    }
  };
  
  // Crear nueva factura
  const handleCrearFactura = async () => {
    // Validaciones
    if (!nuevaFactura.concepto || !nuevaFactura.monto) {
      toast.error('El concepto y monto son obligatorios');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/facturas-pendientes`, nuevaFactura);
      
      toast.success('Factura pendiente registrada correctamente');
      setOpenNuevaFacturaModal(false);
      setNuevaFactura({
        concepto: '',
        proveedor: '',
        numeroFactura: '',
        monto: '',
        fecha: new Date().toISOString().split('T')[0]
      });
      cargarFacturas(); // Recargar para ver la nueva factura
    } catch (error) {
      console.error('Error al crear factura pendiente:', error);
      toast.error('No se pudo registrar la factura');
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar factura
  const handleEliminarFactura = async (facturaId) => {
    if (!window.confirm('¿Estás seguro de eliminar esta factura pendiente?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/facturas-pendientes/${facturaId}`);
      
      toast.success('Factura eliminada correctamente');
      cargarFacturas(); // Recargar lista
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      toast.error('No se pudo eliminar la factura');
    } finally {
      setLoading(false);
    }
  };
  
  // Manejar cambios en formulario de nueva factura
  const handleNuevaFacturaChange = (e) => {
    const { name, value } = e.target;
    setNuevaFactura({
      ...nuevaFactura,
      [name]: value
    });
  };
  
  // Calcular saldo total
  const saldoTotal = facturas.reduce((total, factura) => total + factura.saldo, 0);
  
  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Facturas Pendientes por Pagar
        </Typography>
        
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenNuevaFacturaModal(true)}
        >
          Nueva Factura
        </Button>
      </Box>
      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Filtros
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              variant="outlined"
              size="small"
              onChange={(e) => debouncedSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              select
              label="Estado"
              variant="outlined"
              size="small"
              value={filtroEstado}
              onChange={(e) => {
                setFiltroEstado(e.target.value);
                setPage(0);
              }}
            >
              <MenuItem value="pendientes">Pendientes</MenuItem>
              <MenuItem value="pagadas">Pagadas</MenuItem>
              <MenuItem value="parciales">Pago Parcial</MenuItem>
              <MenuItem value="todas">Todas</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Desde"
              type="date"
              variant="outlined"
              size="small"
              value={fechaDesde}
              onChange={(e) => {
                setFechaDesde(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Hasta"
              type="date"
              variant="outlined"
              size="small"
              value={fechaHasta}
              onChange={(e) => {
                setFechaHasta(e.target.value);
                setPage(0);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant="outlined"
              size="medium"
              startIcon={<RefreshIcon />}
              onClick={handleResetFiltros}
            >
              Reiniciar
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabla de facturas */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="facturas pendientes">
            <TableHead>
              <TableRow>
                <StyledTableCell>Fecha</StyledTableCell>
                <StyledTableCell>Concepto</StyledTableCell>
                <StyledTableCell align="right">Monto</StyledTableCell>
                <StyledTableCell align="right">Abono</StyledTableCell>
                <StyledTableCell align="right">Saldo</StyledTableCell>
                <StyledTableCell align="center">Estado</StyledTableCell>
                <StyledTableCell align="center">Acciones</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && facturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <CircularProgress size={40} />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Cargando facturas...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : facturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography variant="body1">
                      No se encontraron facturas pendientes
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                facturas.map((factura) => (
                  <StyledTableRow 
                    key={factura._id}
                    className={factura.saldo === 0 ? 'pagada' : ''}
                  >
                    <TableCell>{formatearFechaSimple(factura.fecha)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {factura.concepto}
                      </Typography>
                      {factura.proveedor && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          Proveedor: {factura.proveedor}
                        </Typography>
                      )}
                      {factura.numeroFactura && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          N° Factura: {factura.numeroFactura}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatearMoneda(factura.monto)}
                    </TableCell>
                    <TableCell align="right">
                      {formatearMoneda(factura.abono)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatearMoneda(factura.saldo)}
                    </TableCell>
                    <TableCell align="center">
                      {factura.saldo === 0 ? (
                        <Chip 
                          label="Pagada" 
                          color="success" 
                          size="small" 
                        />
                      ) : factura.abono > 0 ? (
                        <Chip 
                          label="Parcial" 
                          color="warning" 
                          size="small" 
                        />
                      ) : (
                        <Chip 
                          label="Pendiente" 
                          color="error" 
                          size="small" 
                        />
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title="Registrar abono">
                          <span>
                            <IconButton 
                              size="small" 
                              color="primary" 
                              disabled={factura.saldo === 0}
                              onClick={() => handleOpenAbonoModal(factura)}
                            >
                              <MoneyIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                        
                        <Tooltip title="Eliminar">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleEliminarFactura(factura._id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 2, bgcolor: 'background.default' }}>
          <Typography variant="body2" color="text.secondary">
            Saldo total: <strong>{formatearMoneda(saldoTotal)}</strong>
          </Typography>
          
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={totalItems}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Filas por página:"
            labelDisplayedRows={({ from, to, count }) => {
              return `${from}–${to} de ${count !== -1 ? count : `más de ${to}`}`;
            }}
          />
        </Box>
      </Paper>
      
      {/* Modal de Abono */}
      <Dialog open={openAbonoModal} onClose={() => setOpenAbonoModal(false)}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Registrar Abono
        </DialogTitle>
        <DialogContent sx={{ pt: 3, minWidth: 400 }}>
          {facturaSeleccionada && (
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Detalles de la Factura:
              </Typography>
              
              <Grid container spacing={1} sx={{ mb: 3 }}>
                <Grid item xs={5}>
                  <Typography variant="body2" color="text.secondary">
                    Concepto:
                  </Typography>
                </Grid>
                <Grid item xs={7}>
                  <Typography variant="body2" fontWeight="medium">
                    {facturaSeleccionada.concepto}
                  </Typography>
                </Grid>
                
                <Grid item xs={5}>
                  <Typography variant="body2" color="text.secondary">
                    Fecha:
                  </Typography>
                </Grid>
                <Grid item xs={7}>
                  <Typography variant="body2">
                    {formatearFechaSimple(facturaSeleccionada.fecha)}
                  </Typography>
                </Grid>
                
                <Grid item xs={5}>
                  <Typography variant="body2" color="text.secondary">
                    Monto Total:
                  </Typography>
                </Grid>
                <Grid item xs={7}>
                  <Typography variant="body2">
                    {formatearMoneda(facturaSeleccionada.monto)}
                  </Typography>
                </Grid>
                
                <Grid item xs={5}>
                  <Typography variant="body2" color="text.secondary">
                    Abono Actual:
                  </Typography>
                </Grid>
                <Grid item xs={7}>
                  <Typography variant="body2">
                    {formatearMoneda(facturaSeleccionada.abono)}
                  </Typography>
                </Grid>
                
                <Grid item xs={5}>
                  <Typography variant="body2" color="text.secondary">
                    Saldo Pendiente:
                  </Typography>
                </Grid>
                <Grid item xs={7}>
                  <Typography variant="body2" fontWeight="bold">
                    {formatearMoneda(facturaSeleccionada.saldo)}
                  </Typography>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 2 }} />
              
              <TextField
                fullWidth
                label="Monto a Abonar"
                type="number"
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
                error={!!errorAbono}
                helperText={errorAbono}
                margin="normal"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Bs.</InputAdornment>
                  ),
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setMontoAbono((facturaSeleccionada.saldo / 2).toFixed(2))}
                >
                  50% ({formatearMoneda(facturaSeleccionada.saldo / 2)})
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setMontoAbono(facturaSeleccionada.saldo.toFixed(2))}
                >
                  100% ({formatearMoneda(facturaSeleccionada.saldo)})
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenAbonoModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleRegistrarAbono}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <MoneyIcon />}
          >
            {loading ? 'Registrando...' : 'Registrar Abono'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Modal de Nueva Factura */}
      <Dialog open={openNuevaFacturaModal} onClose={() => setOpenNuevaFacturaModal(false)}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Registrar Nueva Factura Pendiente
        </DialogTitle>
        <DialogContent sx={{ pt: 3, minWidth: 400 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Concepto"
                name="concepto"
                value={nuevaFactura.concepto}
                onChange={handleNuevaFacturaChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Proveedor"
                name="proveedor"
                value={nuevaFactura.proveedor}
                onChange={handleNuevaFacturaChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número de Factura"
                name="numeroFactura"
                value={nuevaFactura.numeroFactura}
                onChange={handleNuevaFacturaChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Fecha"
                type="date"
                name="fecha"
                value={nuevaFactura.fecha}
                onChange={handleNuevaFacturaChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Monto"
                name="monto"
                type="number"
                value={nuevaFactura.monto}
                onChange={handleNuevaFacturaChange}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">Bs.</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setOpenNuevaFacturaModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            onClick={handleCrearFactura}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            {loading ? 'Registrando...' : 'Registrar Factura'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FacturasPendientes; 