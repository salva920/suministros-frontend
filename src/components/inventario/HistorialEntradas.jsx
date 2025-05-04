import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, TextField, Pagination, Box, 
  styled, useTheme, IconButton, Button, Menu, MenuItem, Tooltip, Chip,
  CircularProgress, Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAlt as FilterIcon,
  FileDownload as ExportIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import moment from 'moment-timezone';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

// 1. Implementamos nuestra propia función debounce
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
}

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

const HistorialEntradas = () => {
  
  
  // Estados
  const [historial, setHistorial] = useState([]);
  const [preciosProductos, setPreciosProductos] = useState({});
  const [inputValue, setInputValue] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'fecha', direction: 'asc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const openFilter = Boolean(filterAnchorEl);
  const timeoutId = useRef(null);
  const debouncedSearchTerm = useDebounce(inputValue, 300);

  // Hooks de efecto y callbacks
  const handleBusqueda = useCallback((e) => {
    const term = e.target.value;
    setInputValue(term);
  }, []);

  const cargarDatos = useCallback(async () => {
    try {
      const [resHistorial, resProductos] = await Promise.all([
        axios.get(`${API_URL}/historial`),
        axios.get(`${API_URL}/productos`)
      ]);
      
      const preciosMap = resProductos.data.reduce((acc, producto) => ({
        ...acc,
        [producto._id]: producto.precio
      }), {});
      
      setPreciosProductos(preciosMap);
      setHistorial(resHistorial.data.historial);
      
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  }, []);

  const fetchHistorial = useCallback(async (pagina = 1) => {
    try {
      const response = await axios.get(`${API_URL}/historial?page=${pagina}`);
      setHistorial(response.data.historial);
      setTotalPaginas(response.data.pages);
      setPaginaActual(response.data.currentPage);
    } catch (error) {
      console.error('Error cargando historial:', error);
      setError(error.response?.data?.message || 'Error al cargar el historial');
    } finally {
      setLoading(false);
    }
  }, []);

  const calcularCosto = useCallback((productoId, cantidad) => {
    return (preciosProductos[productoId] || 0) * cantidad;
  }, [preciosProductos]);

  // Función para manejar el filtrado y ordenación
  const procesarEntradas = useCallback(() => {
    // Filtrado por búsqueda
    const entradasFiltradas = historial.filter(entrada =>
      entrada.nombreProducto.toLowerCase().includes(busqueda.toLowerCase())
    );

    // Ordenación dinámica basada en sortConfig
    const entradasOrdenadas = [...entradasFiltradas].sort((a, b) => {
      const valorA = a[sortConfig.key];
      const valorB = b[sortConfig.key];
      if (valorA < valorB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valorA > valorB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return entradasOrdenadas;
  }, [historial, busqueda, sortConfig]);

  // Efectos
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  useEffect(() => {
    fetchHistorial();
  }, [fetchHistorial]);

  // 2. Efecto para manejar el término de búsqueda debounced
  useEffect(() => {
    setBusqueda(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  // Handlers
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleDateFilterChange = (type, value) => {
    setDateFilter(prev => ({ ...prev, [type]: value }));
    setPaginaActual(1);
  };

  const clearDateFilter = () => {
    setDateFilter({ start: null, end: null });
    setPaginaActual(1);
  };

  // Cálculos derivados
  const filteredHistorial = historial.filter(entrada => {
    const matchesSearch = busqueda === '' || 
      entrada.nombreProducto.toLowerCase().includes(busqueda.toLowerCase());
    
    const matchesDate = (!dateFilter.start || entrada.fecha >= new Date(dateFilter.start)) &&
      (!dateFilter.end || entrada.fecha <= new Date(dateFilter.end));
    
    return matchesSearch && matchesDate;
  });

  const indexOfLastRow = paginaActual * 10;
  const indexOfFirstRow = indexOfLastRow - 10;
  const currentRows = filteredHistorial.slice(indexOfFirstRow, indexOfLastRow);

  // Estilos
  const StyledTableRow = styled(TableRow)(({ theme }) => ({
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
      transition: 'background-color 0.2s ease',
    },
    '&:last-child td, &:last-child th': { border: 0 },
  }));

  const StyledTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 500,
    color: theme.palette.text.primary,
    fontSize: '0.875rem',
  }));

  const HeaderTableCell = styled(TableCell)(({ theme }) => ({
    fontWeight: 'bold',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.common.white,
    fontSize: '1rem',
    cursor: 'pointer',
    '&:hover': { backgroundColor: theme.palette.primary.dark },
  }));

  // Render condicional
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ mt: 3, p: 3, borderRadius: 2, boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)' }}>
      {/* Header y controles */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '1.5rem' }}>
          Historial de Entradas
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Buscar por código o nombre..."
            value={inputValue}
            onChange={handleBusqueda}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
              endAdornment: inputValue && (
                <IconButton onClick={() => setInputValue('')} size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
              sx: { borderRadius: '25px', backgroundColor: 'background.paper', minWidth: '300px' }
            }}
          />
          
          <Tooltip title="Filtrar por fecha">
            <IconButton
              onClick={handleFilterClick}
              color={dateFilter.start || dateFilter.end ? 'primary' : 'default'}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={() => {
              const csvContent = [
                ['Producto', 'Código', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Fecha y Hora', 'Operación', 'Costo Final'],
                ...filteredHistorial.map(entrada => [
                  `"${entrada.nombreProducto.replace(/"/g, '""')}"`,
                  entrada.codigoProducto,
                  `+${entrada.cantidad}`,
                  entrada.stockAnterior,
                  entrada.stockNuevo,
                  `"${moment.utc(entrada.fecha).format('DD/MM/YYYY HH:mm')}"`,
                  entrada.operacion.toUpperCase(),
                  `$${calcularCosto(entrada.producto, entrada.cantidad).toFixed(2)}`
                ])
              ].join('\n');
              
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              saveAs(blob, 'historial_entradas.csv');
            }}
            sx={{ borderRadius: '25px', textTransform: 'none', px: 3 }}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Filtros y tabla */}
      <Menu
        anchorEl={filterAnchorEl}
        open={openFilter}
        onClose={handleFilterClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem disabled><Typography variant="subtitle2">Filtrar por fecha</Typography></MenuItem>
        <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="caption" sx={{ mb: 1 }}>Desde:</Typography>
          <TextField
            type="date"
            value={dateFilter.start || ''}
            onChange={(e) => handleDateFilterChange('start', e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </MenuItem>
        <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="caption" sx={{ mb: 1 }}>Hasta:</Typography>
          <TextField
            type="date"
            value={dateFilter.end || ''}
            onChange={(e) => handleDateFilterChange('end', e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
          />
        </MenuItem>
        <MenuItem onClick={clearDateFilter} disabled={!dateFilter.start && !dateFilter.end}>
          <Typography variant="body2" color="primary">Limpiar filtros</Typography>
        </MenuItem>
      </Menu>

      {(dateFilter.start || dateFilter.end) && (
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Filtrado por fechas: 
          </Typography>
          {dateFilter.start && <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Desde: {new Date(dateFilter.start).toLocaleDateString('es-ES')}
          </Typography>}
          {dateFilter.end && <Typography variant="body2" sx={{ fontWeight: 500 }}>
            Hasta: {new Date(dateFilter.end).toLocaleDateString('es-ES')}
          </Typography>}
          <IconButton size="small" onClick={clearDateFilter}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <TableContainer component={Paper} elevation={0} sx={{ mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              {['nombreProducto', 'codigoProducto', 'cantidad', 'stockAnterior', 'stockNuevo', 'fecha', 'operacion'].map((header) => (
                <HeaderTableCell 
                  key={header}
                  align={header === 'operacion' ? 'center' : 'right'}
                  onClick={() => requestSort(header === 'fecha' ? '_fechaOrdenable' : header)}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: header === 'nombreProducto' ? 'flex-start' : 'flex-end'
                  }}>
                    {{
                      nombreProducto: 'Producto',
                      codigoProducto: 'Código',
                      cantidad: 'Cantidad',
                      stockAnterior: 'Stock Anterior',
                      stockNuevo: 'Stock Nuevo',
                      fecha: 'Fecha y Hora',
                      operacion: 'Operación'
                    }[header]}
                    {sortConfig.key === (header === 'fecha' ? '_fechaOrdenable' : header) && (
                      sortConfig.direction === 'asc' ? 
                        <ArrowUpIcon fontSize="small" sx={{ ml: 0.5 }} /> : 
                        <ArrowDownIcon fontSize="small" sx={{ ml: 0.5 }} />
                    )}
                  </Box>
                </HeaderTableCell>
              ))}
            </TableRow>
          </TableHead>
          
          <TableBody>
            {currentRows.map((entrada) => (
              <StyledTableRow key={`${entrada.fecha}-${entrada.codigoProducto}`}>
                <StyledTableCell>{entrada.nombreProducto}</StyledTableCell>
                <StyledTableCell align="right">{entrada.codigoProducto}</StyledTableCell>
                <StyledTableCell align="right">
                  <Chip 
                    label={`+${entrada.cantidad}`} 
                    color="success" 
                    variant="outlined" 
                  />
                </StyledTableCell>
                <StyledTableCell align="right">{entrada.stockAnterior}</StyledTableCell>
                <StyledTableCell align="right">
                  {entrada.stockNuevo}
                </StyledTableCell>
                <StyledTableCell align="right">
                  {formatearFechaSimple(entrada.fecha)}
                </StyledTableCell>
                <StyledTableCell align="center">
                  <Chip
                    label={
                      entrada.operacion === 'creacion' ? 'Creación' :
                      entrada.operacion === 'entrada' ? 'Entrada' : 
                      'Ajuste'
                    }
                    color={
                      entrada.operacion === 'creacion' ? 'primary' :
                      entrada.operacion === 'entrada' ? 'success' : 
                      'warning'
                    }
                  />
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Paginación y mensajes */}
      {filteredHistorial.length === 0 ? (
        <Typography variant="body1" sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>
          {inputValue || dateFilter.start || dateFilter.end ? 
            'No se encontraron resultados' : 
            'No hay registros disponibles'}
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Mostrando {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredHistorial.length)} de {filteredHistorial.length}
          </Typography>
          <Pagination
            count={totalPaginas}
            page={paginaActual}
            onChange={(e, newPage) => {
              if (newPage < 1 || newPage > totalPaginas) return;
              fetchHistorial(newPage);
            }}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                color: 'primary.main',
                '&.Mui-selected': { backgroundColor: 'primary.main', color: 'common.white' }
              }
            }}
          />
        </Box>
      )}
    </Paper>
  );
};

export default HistorialEntradas;