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
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

// URL de la API - CORREGIDA para coincidir con server.js
const API_URL = "https://suministros-backend.vercel.app/api/facturaPendiente";

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
      
      const response = await axios.get(`${API_URL}?${params.toString()}`);
      
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
  
  // Manejador de cambio de página
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // Manejador de cambio de filas por página
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Función para buscar facturas (con debounce)
  const buscarFacturas = debounce((valor) => {
    setBusqueda(valor);
    setPage(0);
  }, 500);
  
  // Manejador de cambio en búsqueda
  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    buscarFacturas(valor);
  };
  
  // Manejador de cambio en filtro de estado
  const handleFiltroEstadoChange = (e) => {
    setFiltroEstado(e.target.value);
    setPage(0);
  };
  
  // Manejador de cambio en fecha desde
  const handleFechaDesdeChange = (e) => {
    setFechaDesde(e.target.value);
    setPage(0);
  };
  
  // Manejador de cambio en fecha hasta
  const handleFechaHastaChange = (e) => {
    setFechaHasta(e.target.value);
    setPage(0);
  };
  
  // Abrir modal de abono
  const abrirModalAbono = (factura) => {
    setFacturaSeleccionada(factura);
    setMontoAbono('');
    setErrorAbono('');
    setOpenAbonoModal(true);
  };
  
  // Registrar abono
  const handleRegistrarAbono = async () => {
    if (!montoAbono || isNaN(montoAbono) || parseFloat(montoAbono) <= 0) {
      setErrorAbono('Ingrese un monto válido');
      return;
    }
    
    if (parseFloat(montoAbono) > facturaSeleccionada.saldo) {
      setErrorAbono('El abono no puede superar el saldo pendiente');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${API_URL}/${facturaSeleccionada._id}/abonos`, {
        monto: parseFloat(montoAbono)
      });
      
      toast.success('Abono registrado correctamente');
      setOpenAbonoModal(false);
      cargarFacturas();
    } catch (error) {
      console.error('Error al registrar abono:', error);
      toast.error('Error al registrar el abono');
    } finally {
      setLoading(false);
    }
  };
  
  // Abrir modal de nueva factura
  const abrirModalNuevaFactura = () => {
    setNuevaFactura({
      concepto: '',
      proveedor: '',
      numeroFactura: '',
      monto: '',
      fecha: new Date().toISOString().split('T')[0]
    });
    setOpenNuevaFacturaModal(true);
  };
  
  // Manejador de cambio en campos de nueva factura
  const handleNuevaFacturaChange = (e) => {
    const { name, value } = e.target;
    setNuevaFactura(prev => ({ ...prev, [name]: value }));
  };
  
  // Crear nueva factura
  const handleCrearFactura = async () => {
    if (!nuevaFactura.concepto.trim()) {
      toast.error('El concepto es obligatorio');
      return;
    }
    
    if (!nuevaFactura.monto || isNaN(nuevaFactura.monto) || parseFloat(nuevaFactura.monto) <= 0) {
      toast.error('Ingrese un monto válido');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(API_URL, nuevaFactura);
      
      toast.success('Factura registrada correctamente');
      setOpenNuevaFacturaModal(false);
      cargarFacturas();
    } catch (error) {
      console.error('Error al crear factura:', error);
      toast.error('Error al registrar la factura');
    } finally {
      setLoading(false);
    }
  };
  
  // Eliminar factura
  const handleEliminarFactura = async (facturaId) => {
    if (!window.confirm('¿Está seguro de eliminar esta factura?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${facturaId}`);
      
      toast.success('Factura eliminada correctamente');
      cargarFacturas();
    } catch (error) {
      console.error('Error al eliminar factura:', error);
      toast.error('Error al eliminar la factura');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <ToastContainer position="top-right" autoClose={3000} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" color="primary" gutterBottom>
          Facturas Pendientes
        </Typography>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={abrirModalNuevaFactura}
        >
          Nueva Factura
        </Button>
      </Box>
      
      {/* Filtros */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Buscar"
              variant="outlined"
              size="small"
              onChange={handleBusquedaChange}
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
              value={filtroEstado}
              onChange={handleFiltroEstadoChange}
              variant="outlined"
              size="small"
            >
              <MenuItem value="pendientes">Pendientes</MenuItem>
              <MenuItem value="parciales">Abonadas</MenuItem>
              <MenuItem value="pagadas">Pagadas</MenuItem>
              <MenuItem value="todas">Todas</MenuItem>
            </TextField>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Desde"
              type="date"
              value={fechaDesde}
              onChange={handleFechaDesdeChange}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={fechaHasta}
              onChange={handleFechaHastaChange}
              variant="outlined"
              size="small"
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
      </Paper>
      
      {/* Tabla de facturas */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>Fecha</StyledTableCell>
                <StyledTableCell>Concepto</StyledTableCell>
                <StyledTableCell>Proveedor</StyledTableCell>
                <StyledTableCell>N° Factura</StyledTableCell>
                <StyledTableCell align="right">Monto</StyledTableCell>
                <StyledTableCell align="right">Abonado</StyledTableCell>
                <StyledTableCell align="right">Saldo</StyledTableCell>
                <StyledTableCell align="center">Acciones</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && facturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <CircularProgress size={40} />
                    <Typography sx={{ mt: 2 }}>Cargando facturas...</Typography>
                  </TableCell>
                </TableRow>
              ) : facturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Alert severity="info">
                      No hay facturas que coincidan con los filtros aplicados
                    </Alert>
                  </TableCell>
                </TableRow>
              ) : (
                facturas.map((factura) => (
                  <StyledTableRow 
                    key={factura._id}
                    className={factura.saldo === 0 ? 'pagada' : ''}
                  >
                    <TableCell>{formatearFechaSimple(factura.fecha)}</TableCell>
                    <TableCell>{factura.concepto}</TableCell>
                    <TableCell>{factura.proveedor || '-'}</TableCell>
                    <TableCell>{factura.numeroFactura || '-'}</TableCell>
                    <TableCell align="right">{formatearMoneda(factura.monto)}</TableCell>
                    <TableCell align="right">{formatearMoneda(factura.abono)}</TableCell>
                    <TableCell align="right">
                      <Chip 
                        label={formatearMoneda(factura.saldo)}
                        color={factura.saldo === 0 ? 'success' : factura.abono > 0 ? 'warning' : 'error'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        {factura.saldo > 0 && (
                          <Tooltip title="Registrar abono">
                            <IconButton 
                              color="primary"
                              onClick={() => abrirModalAbono(factura)}
                            >
                              <MoneyIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                        <Tooltip title="Eliminar">
                          <IconButton 
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
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalItems}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
        />
      </Paper>
      
      {/* Modal de Abono */}
      <Dialog open={openAbonoModal} onClose={() => setOpenAbonoModal(false)}>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
          Registrar Abono
        </DialogTitle>
        <DialogContent sx={{ pt: 3, minWidth: 400 }}>
          {facturaSeleccionada && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Concepto:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {facturaSeleccionada.concepto}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Fecha:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatearFechaSimple(facturaSeleccionada.fecha)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Monto Total:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatearMoneda(facturaSeleccionada.monto)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Total Abonado:</Typography>
                  <Typography variant="body1" gutterBottom>
                    {formatearMoneda(facturaSeleccionada.abono)}
                  </Typography>
                </Grid>
                
                <Grid item xs={6}>
                  <Typography variant="subtitle2">Saldo Pendiente:</Typography>
                  <Typography variant="body1" gutterBottom color="error.main" fontWeight="bold">
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