import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, Typography, TableContainer, Table, TableHead, 
  TableRow, TableCell, TableBody, Chip, TextField, 
  Button, IconButton, Box, Divider, InputAdornment, Paper, CircularProgress
} from '@mui/material';
import { Print, AttachMoney, CheckCircle, Payment } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import GenerarFactura from './GenerarFactura.jsx'; // Importar el componente GenerarFactura
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-hot-toast';

// Definir la URL de la API
const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 16,
    boxShadow: theme.shadows[5],
  },
}));

const HeaderTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  padding: theme.spacing(3),
  '& .MuiTypography-root': {
    fontSize: '1.5rem',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
}));

const InfoItem = ({ label, value, icon }) => (
  <Grid item xs={12} md={6}>
    <Box display="flex" alignItems="center" gap={1.5}>
      {React.cloneElement(icon, { fontSize: "small", color: "action" })}
      <Typography variant="subtitle1">
        <strong>{label}:</strong> {value || 'N/A'}
      </Typography>
    </Box>
  </Grid>
);

const RegistroClienteDialog = ({ 
  open, 
  onClose, 
  clienteSeleccionado, 
  ventasCliente, 
  deudaTotal, 
  montoAbonar, 
  setMontoAbonar, 
  handleAbonarSaldo, 
  handleImprimirFactura,
  handleSolventarDeudaCompleta
}) => {
  const [ventasActualizadas, setVentasActualizadas] = useState(ventasCliente);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarGenerarFactura, setMostrarGenerarFactura] = useState(false);
  const [montosAbono, setMontosAbono] = useState({});
  const [deudaTotalCalculada, setDeudaTotalCalculada] = useState(0);
  const [loading, setLoading] = useState(false);

  // Actualizar ventasActualizadas cuando cambien las ventasCliente
  useEffect(() => {
    setVentasActualizadas(ventasCliente);
  }, [ventasCliente]);

  useEffect(() => {
    const calcularDeuda = () => {
      const total = ventasActualizadas.reduce(
        (acc, venta) => acc + (venta.saldoPendiente || 0), 0
      );
      setDeudaTotalCalculada(total);
    };
    calcularDeuda();
  }, [ventasActualizadas]);

  // Asegurar carga de ventas pendientes al abrir el modal
  useEffect(() => {
    const cargarVentasPendientes = async () => {
      // Solo cargar si hay un cliente seleccionado y el modal está abierto
      if (open && clienteSeleccionado?._id) {
        try {
          setLoading(true);
          
          const response = await fetch(`${API_URL}/ventas/pendientes/${clienteSeleccionado._id}`);
          
          if (!response.ok) {
            throw new Error('Error al cargar ventas pendientes');
          }
          
          const data = await response.json();
          
          // Validar la estructura de datos
          if (!data.success || !Array.isArray(data.ventas)) {
            throw new Error('Formato de respuesta inválido');
          }
          
          // Actualizar estado con las ventas pendientes
          setVentasActualizadas(data.ventas);
          
          // Calcular deuda total inicial
          const totalDeuda = data.ventas.reduce(
            (acc, venta) => acc + (venta.saldoPendiente || 0), 
            0
          );
          
          setDeudaTotalCalculada(totalDeuda);
          
          // Inicializar montos de abono en cero para cada venta
          const montosIniciales = data.ventas.reduce((acc, venta) => {
            acc[venta._id] = 0;
            return acc;
          }, {});
          
          setMontosAbono(montosIniciales);
          
        } catch (error) {
          console.error('Error al cargar ventas pendientes:', error);
          toast.error(`Error: ${error.message}`);
        } finally {
          setLoading(false);
        }
      }
    };

    cargarVentasPendientes();
  }, [open, clienteSeleccionado?._id]); // Dependencias correctas

  // Manejar cambio en los inputs de abono
  const handleMontoChange = (ventaId, monto) => {
    setMontosAbono(prev => ({
      ...prev,
      [ventaId]: Number(monto)
    }));
  };

  // Abonar a una venta específica
  const handleAbonar = async (venta) => {
    const monto = parseFloat(montosAbono[venta._id]) || 0;
    
    // Validaciones mejoradas
    if (monto <= 0) {
      alert('Ingrese un monto válido');
      return;
    }
    
    if (monto > venta.saldoPendiente) {
      alert('El monto excede el saldo pendiente');
      return;
    }
  
    try {
      const response = await axios.put(`${API_URL}/ventas/${venta._id}`, {
        montoAbonado: venta.montoAbonado + monto,
        saldoPendiente: venta.saldoPendiente - monto
      });
      
      // Actualizar estado local y padre
      const ventaActualizada = response.data;
      setVentasActualizadas(prev => 
        prev.map(v => v._id === venta._id ? ventaActualizada : v)
      );
      handleAbonarSaldo(ventaActualizada);
      
    } catch (error) {
      console.error('Error en abono:', error.response?.data);
    }
  };

  // Función para solventar la deuda de una venta específica
  const handleSolventarDeuda = async (venta) => {
    try {
      const ventaActualizada = {
        ...venta,
        montoAbonado: venta.total,
        saldoPendiente: 0
      };
      await axios.put(`${API_URL}/ventas/${venta._id}`, ventaActualizada);
      setVentasActualizadas(prev => 
        prev.map(v => (v._id === venta._id ? ventaActualizada : v))
      );
      handleAbonarSaldo(ventaActualizada); // Notificar al componente padre
    } catch (error) {
      console.error('Error al solventar deuda:', error);
    }
  };

  // Función para abrir el diálogo de generación de factura
  const handleGenerarFactura = (venta) => {
    setVentaSeleccionada(venta);
    setMostrarGenerarFactura(true);
  };

  // Función para cerrar el diálogo de generación de factura
  const handleCerrarGenerarFactura = () => {
    setMostrarGenerarFactura(false);
    setVentaSeleccionada(null);
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <HeaderTitle>
        <AttachMoney fontSize="inherit" />
        Registro Completo - {clienteSeleccionado?.nombre}
      </HeaderTitle>
      
      <DialogContent sx={{ py: 3 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <InfoItem 
            label="RIF" 
            value={clienteSeleccionado?.rif} 
            icon={<Payment />}
          />
          <InfoItem 
            label="Teléfono" 
            value={clienteSeleccionado?.telefono} 
            icon={<Payment />}
          />
          <InfoItem 
            label="Email" 
            value={clienteSeleccionado?.email} 
            icon={<Payment />}
          />
          <InfoItem 
            label="Dirección" 
            value={clienteSeleccionado?.direccion} 
            icon={<Payment />}
          />
          <InfoItem 
            label="Municipio" 
            value={clienteSeleccionado?.municipio} 
            icon={<Payment />}
          />
        </Grid>

        <Divider sx={{ my: 2 }} />

        <Typography variant="h6" sx={{ 
          mb: 2,
          fontWeight: 600,
          color: 'text.secondary',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <CheckCircle fontSize="small" />
          Historial de Ventas
        </Typography>

        <TableContainer sx={{ 
          border: 1, 
          borderColor: 'divider', 
          borderRadius: 2,
          overflow: 'hidden'
        }}>
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                {['Fecha', 'Total', 'Abonado', 'Saldo', 'Estado', 'Factura', 'Acciones'].map((header) => (
                  <TableCell key={header} sx={{ 
                    fontWeight: 600,
                    py: 2,
                    borderBottom: 'none'
                  }}>
                    {header}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {ventasActualizadas.map(venta => (
                <TableRow 
                  key={venta._id}
                  hover
                  sx={{ '&:last-child td': { borderBottom: 0 } }}
                >
                  <TableCell>{moment(venta.fecha).format('DD/MM/YYYY HH:mm')}</TableCell>
                  <TableCell>${(venta.total || 0).toFixed(2)}</TableCell>
                  <TableCell>${(venta.montoAbonado || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ 
                    color: venta.saldoPendiente > 0 ? 'error.main' : 'success.main',
                    fontWeight: 500
                  }}>
                    ${(venta.saldoPendiente || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={venta.saldoPendiente > 0 ? 'Pendiente' : 'Pagado'} 
                      color={venta.saldoPendiente > 0 ? 'error' : 'success'}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{venta.nrFactura}</TableCell>
                  <TableCell>
                    {venta.saldoPendiente > 0 && (
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <TextField
                          type="number"
                          size="small"
                          value={montosAbono[venta._id] || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            // Validar que el valor esté dentro del rango permitido
                            if (!isNaN(value) && value >= 0 && value <= venta.saldoPendiente) {
                              handleMontoChange(venta._id, value);
                            }
                          }}
                          sx={{ 
                            width: 120,
                            '& .MuiOutlinedInput-root': {
                              '& fieldset': { borderColor: '#e0e0e0' },
                              '&:hover fieldset': { borderColor: '#1976d2' },
                              '&.Mui-focused fieldset': { borderColor: '#1976d2' }
                            }
                          }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <AttachMoney fontSize="small" color="action" />
                              </InputAdornment>
                            ),
                            inputProps: { 
                              min: 0,
                              max: venta.saldoPendiente,
                              step: 0.01,
                              style: { 
                                textAlign: 'right',
                                paddingRight: '8px'
                              }
                            }
                          }}
                          error={montosAbono[venta._id] > venta.saldoPendiente}
                          helperText={
                            montosAbono[venta._id] > venta.saldoPendiente 
                              ? `Monto excede el saldo (${venta.saldoPendiente.toFixed(2)})`
                              : ''
                          }
                        />
                        <Button 
                          variant="contained" 
                          size="small"
                          onClick={() => handleAbonar(venta)}
                          sx={{ minWidth: 90 }}
                        >
                          Abonar
                        </Button>
                        <Button 
                          variant="outlined" 
                          color="success" 
                          size="small"
                          onClick={() => handleSolventarDeuda(venta)}  // Pasar la venta específica
                          sx={{ minWidth: 100 }}
                        >
                          Solventar
                        </Button>
                      </Box>
                    )}
                    <IconButton 
                      onClick={() => handleGenerarFactura(venta)}
                      sx={{ ml: 1 }}
                    >
                      <Print fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{
          mt: 3,
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Typography variant="h6" component="div">
            Deuda Total:
          </Typography>
          <Typography variant="h5" sx={{ 
            fontWeight: 600,
            color: deudaTotalCalculada > 0 ? 'error.main' : 'success.main'
          }}>
            ${deudaTotalCalculada.toFixed(2)}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button 
          onClick={onClose} 
          variant="outlined" 
          color="inherit"
          sx={{ borderRadius: 2 }}
        >
          Cerrar
        </Button>
      </DialogActions>

      {/* Diálogo para Generar Factura */}
      {mostrarGenerarFactura && (
        <GenerarFactura 
          venta={ventaSeleccionada} 
          onClose={handleCerrarGenerarFactura} 
        />
      )}
    </StyledDialog>
  );
};

export default RegistroClienteDialog;