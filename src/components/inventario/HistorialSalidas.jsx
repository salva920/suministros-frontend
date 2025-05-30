import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, TextField, Pagination, Box, 
  styled, useTheme, IconButton, Button, Menu, MenuItem, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText
} from '@mui/material';
import {
  Search as SearchIcon,
  Clear as ClearIcon,
  FilterAlt as FilterIcon,
  FileDownload as ExportIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import { saveAs } from 'file-saver';
import { debounce } from 'lodash';
import { toast } from 'react-hot-toast';
import moment from 'moment';
import axios from 'axios';

// Estilos personalizados
const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:hover': {
    
    backgroundColor: theme.palette.action.hover,
    transition: 'background-color 0.2s ease',
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
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
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const HistorialSalidas = ({ productos, showFinancials }) => {
  const theme = useTheme();
  const [historial, setHistorial] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [sortConfig] = useState({ key: 'fechaHora', direction: 'desc' });
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [dateFilter, setDateFilter] = useState({ start: null, end: null });
  const openFilter = Boolean(filterAnchorEl);

  const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

  // Función para cargar el historial de salidas desde la API
  const cargarHistorial = async () => {
    try {
      const response = await axios.get(`${API_URL}/ventas?getAll=true`);
      
      const historialProcesado = response.data.ventas.flatMap(venta => 
        venta.productos.map(p => ({
          // Datos específicos del producto vendido
          producto: p.producto?.nombre || 'Producto no disponible',
          cantidad: p.cantidad,
          precioUnitario: p.precioUnitario || 0,
          costoInicial: p.producto?.costoFinal || 0,
          gananciaUnitaria: p.gananciaUnitaria || 0,  // Valor por defecto
          gananciaTotal: p.gananciaTotal || 0,        // Valor por defecto
          
          // Datos generales de la venta
          fecha: new Date(venta.fecha),
          fechaFormateada: moment.utc(venta.fecha).format('DD/MM/YYYY'),
          cliente: venta.cliente?.nombre || 'Cliente no registrado',
          metodoPago: venta.metodoPago,
          nrFactura: venta.nrFactura,
          totalVenta: venta.total
        }))
      );

      setHistorial(historialProcesado);
    } catch (error) {
      console.error('Error al cargar el historial:', error);
      toast.error('Error al cargar el historial de salidas');
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    cargarHistorial();
  }, [page, rowsPerPage, sortConfig]);

  // Búsqueda con debounce
  useEffect(() => {
    const debouncer = debounce(() => {
      setDebouncedSearchTerm(searchTerm);
      setPage(1);
    }, 300);
    
    debouncer();
    return () => debouncer.cancel();
  }, [searchTerm]);

  // Ordenamiento
  const sortedHistorial = useCallback(() => {
    return [...historial].sort((a, b) => {
      if (sortConfig.key === 'fechaHora') {
        return sortConfig.direction === 'asc' 
          ? a.fechaHora - b.fechaHora 
          : b.fechaHora - a.fechaHora;
      }
      return sortConfig.direction === 'asc'
        ? String(a[sortConfig.key]).localeCompare(String(b[sortConfig.key]))
        : String(b[sortConfig.key]).localeCompare(String(a[sortConfig.key]));
    });
  }, [historial, sortConfig]);

  // Filtrado
  const filteredHistorial = sortedHistorial().filter(salida => {
    const matchesProduct = salida.producto.toLowerCase().includes(debouncedSearchTerm.toLowerCase());

    // Convertir fecha del input a UTC para comparar correctamente
    const toUTCDate = (dateString) => {
      if (!dateString) return null;
      const [year, month, day] = dateString.split('-');
      return new Date(Date.UTC(year, month - 1, day));
    };

    const matchesDate =
      (!dateFilter.start || new Date(salida.fecha) >= toUTCDate(dateFilter.start)) &&
      (!dateFilter.end || new Date(salida.fecha) <= toUTCDate(dateFilter.end));

    return matchesProduct && matchesDate;
  });

  // Paginación
  const indexOfLastRow = page * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredHistorial.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredHistorial.length / rowsPerPage);

  // Exportar a CSV
  const exportToCSV = () => {
    const headers = [
      'Fecha y Hora', 
      'Producto', 
      'Cantidad', 
      'Cliente', 
      'Precio Unitario', 
      'Total', 
      'Número de Factura',
      'Ganancia Unitaria',
      'Ganancia Total'
    ];
    
    const csvContent = [
      headers.join(','),
      ...filteredHistorial.map(salida => [
        `"${salida.fechaFormateada || ''}"`,
        `"${salida.producto || ''}"`,
        salida.cantidad || 0,
        `"${salida.cliente || ''}"`,
        (salida.precioUnitario || 0).toFixed(2),
        (salida.totalVenta || 0).toFixed(2),
        `"${salida.nrFactura || ''}"`,
        (salida.gananciaUnitaria || 0).toFixed(2),
        (salida.gananciaTotal || 0).toFixed(2)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `historial_salidas_${moment().format('YYYYMMDD_HHmmss')}.csv`);
  };

  // Función para manejar el filtrado por fecha
  const handleDateFilter = (type, value) => {
    setDateFilter(prev => ({ ...prev, [type]: value }));
    setPage(1); // Reiniciar la paginación al aplicar un filtro
  };

  // Función para limpiar los filtros de fecha
  const clearDateFilter = () => {
    setDateFilter({ start: null, end: null });
    setPage(1); // Reiniciar la paginación al limpiar los filtros
  };

  return (
    <Paper elevation={3} sx={{ 
      mt: 3, 
      p: 3, 
      borderRadius: 2,
      boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      {/* Header y controles */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}>
        <Typography variant="h5" sx={{ 
          fontWeight: 'bold', 
          color: theme.palette.primary.main,
          fontSize: '1.5rem'
        }}>
          Historial de Salidas
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            variant="outlined"
            placeholder="Buscar por producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
              endAdornment: searchTerm && (
                <IconButton onClick={() => setSearchTerm('')} size="small">
                  <ClearIcon fontSize="small" />
                </IconButton>
              ),
              sx: { borderRadius: '25px', backgroundColor: 'background.paper', minWidth: '300px' }
            }}
          />
          
          <Tooltip title="Filtrar por fecha">
            <IconButton
              onClick={(e) => setFilterAnchorEl(e.currentTarget)}
              color={dateFilter.start || dateFilter.end ? 'primary' : 'default'}
              sx={{ border: '1px solid', borderColor: theme.palette.divider }}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<ExportIcon />}
            onClick={exportToCSV}
            sx={{ borderRadius: '25px', px: 3 }}
          >
            Exportar
          </Button>
        </Box>
      </Box>

      {/* Menú de filtro por fecha */}
      <Menu
        anchorEl={filterAnchorEl}
        open={openFilter}
        onClose={() => setFilterAnchorEl(null)}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2">Filtrar por fecha</Typography>
        </MenuItem>
        <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="caption">Desde:</Typography>
          <TextField
            type="date"
            value={dateFilter.start || ''}
            onChange={(e) => handleDateFilter('start', e.target.value)}
            fullWidth
            size="small"
          />
        </MenuItem>
        <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
          <Typography variant="caption">Hasta:</Typography>
          <TextField
            type="date"
            value={dateFilter.end || ''}
            onChange={(e) => handleDateFilter('end', e.target.value)}
            fullWidth
            size="small"
          />
        </MenuItem>
        <MenuItem onClick={clearDateFilter} disabled={!dateFilter.start && !dateFilter.end}>
          <Typography color="primary">Limpiar filtros</Typography>
        </MenuItem>
      </Menu>

      {/* Tabla de resultados */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <HeaderTableCell>Fecha</HeaderTableCell>
              <HeaderTableCell>Producto</HeaderTableCell>
              <HeaderTableCell>Cantidad</HeaderTableCell>
              {showFinancials && (
                <>
                  <HeaderTableCell>Costo Unitario</HeaderTableCell>
                  <HeaderTableCell>P. Venta Unit.</HeaderTableCell>
                  <HeaderTableCell>G. Unitaria</HeaderTableCell>
                  <HeaderTableCell>G. Total Prod.</HeaderTableCell>
                </>
              )}
              <HeaderTableCell>Cliente</HeaderTableCell>
              <HeaderTableCell>Total Venta</HeaderTableCell>
              <HeaderTableCell>Método Pago</HeaderTableCell>
              <HeaderTableCell>Factura</HeaderTableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {currentRows.map((salida, index) => (
              <StyledTableRow key={index}>
                <StyledTableCell>{salida.fechaFormateada}</StyledTableCell>
                <StyledTableCell>{salida.producto}</StyledTableCell>
                <StyledTableCell>{salida.cantidad}</StyledTableCell>
                {showFinancials && (
                  <>
                    <StyledTableCell>${salida.costoInicial.toFixed(2)}</StyledTableCell>
                    <StyledTableCell>${salida.precioUnitario.toFixed(2)}</StyledTableCell>
                    <StyledTableCell>${salida.gananciaUnitaria.toFixed(2)}</StyledTableCell>
                    <StyledTableCell>${salida.gananciaTotal.toFixed(2)}</StyledTableCell>
                  </>
                )}
                <StyledTableCell>{salida.cliente}</StyledTableCell>
                <StyledTableCell>${salida.totalVenta.toFixed(2)}</StyledTableCell>
                <StyledTableCell>{salida.metodoPago}</StyledTableCell>
                <StyledTableCell>{salida.nrFactura}</StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Mensaje sin resultados */}
      {filteredHistorial.length === 0 && (
        <Typography variant="body1" sx={{ 
          textAlign: 'center', 
          p: 3, 
          color: theme.palette.text.secondary
        }}>
          {searchTerm || dateFilter.start || dateFilter.end 
            ? 'No se encontraron resultados' 
            : 'No hay registros de salidas'}
        </Typography>
      )}

      {/* Paginación y contador */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mt: 3,
        p: 2
      }}>
        <Typography variant="body2" color="textSecondary">
          Mostrando {indexOfFirstRow + 1}-{Math.min(indexOfLastRow, filteredHistorial.length)} de {filteredHistorial.length} registros
        </Typography>
        
        <Pagination
          count={totalPages}
          page={page}
          onChange={(e, newPage) => setPage(newPage)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
        />
      </Box>
    </Paper>
  );
};

export default HistorialSalidas;