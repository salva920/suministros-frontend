import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, Typography, TableContainer, Table, TableHead, 
  TableRow, TableCell, TableBody, Chip, TextField, 
  Button, IconButton, Box, Divider, InputAdornment, Paper, CircularProgress
} from '@mui/material';
import { Print, AttachMoney, CheckCircle, Payment } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import GenerarFactura from './GenerarFactura';
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-hot-toast';

const API_URL = "https://suministros-backend.vercel.app/api";

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
  handleImprimirFactura
}) => {
  const [ventas, setVentas] = useState([]);
  const [montosAbono, setMontosAbono] = useState({});
  const [mostrarGenerarFactura, setMostrarGenerarFactura] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(false);

  // Actualizar ventas cuando cambia ventasCliente o clienteSeleccionado
  useEffect(() => {
    if (ventasCliente && clienteSeleccionado) {
      // Normalizar el ID del cliente seleccionado
      const clienteId = clienteSeleccionado._id?.toString();
      
      if (!clienteId) {
        console.error('ID de cliente inválido');
        return;
      }

      // Filtrar y normalizar ventas
      const ventasFiltradas = ventasCliente
        .filter(v => {
          // Normalizar ID del cliente en la venta
          const ventaClienteId = v.cliente?._id?.toString() || v.cliente?.toString();
          return ventaClienteId === clienteId;
        })
        .map(v => ({
          ...v,
          _id: v._id?.toString(),
          cliente: {
            _id: v.cliente?._id?.toString(),
            nombre: v.cliente?.nombre,
            rif: v.cliente?.rif
          },
          fecha: v.fecha ? new Date(v.fecha) : null,
          total: parseFloat(v.total || 0),
          montoAbonado: parseFloat(v.montoAbonado || 0),
          saldoPendiente: parseFloat(v.saldoPendiente || 0)
        }));
      
      // Ordenar por fecha descendente
      const ventasOrdenadas = [...ventasFiltradas].sort((a, b) => 
        (b.fecha || 0) - (a.fecha || 0)
      );
      
      setVentas(ventasOrdenadas);
    } else {
      setVentas([]);
    }
  }, [ventasCliente, clienteSeleccionado]);

  // Limpiar estados cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      setVentas([]);
      setMontosAbono({});
      setVentaSeleccionada(null);
    }
  }, [open]);

  const calcularDeudaTotal = () => {
    return ventas.reduce((total, venta) => {
      return total + (venta.saldoPendiente || 0);
    }, 0);
  };

  const handleMontoChange = (ventaId, value) => {
    setMontosAbono(prev => ({
      ...prev,
      [ventaId]: value
    }));
  };

  const handleAbonar = async (venta) => {
    const monto = montosAbono[venta._id];
    if (!monto || monto <= 0) return;

    try {
      const ventaActualizada = {
        ...venta,
        montoAbonado: (venta.montoAbonado || 0) + monto,
        saldoPendiente: (venta.saldoPendiente || 0) - monto
      };

      handleAbonarSaldo(ventaActualizada);
      setMontosAbono(prev => ({ ...prev, [venta._id]: '' }));
      toast.success(`Abono de $${monto.toFixed(2)} registrado`);
    } catch (error) {
      toast.error('Error al procesar el abono');
    }
  };

  const handleSolventarDeuda = async (venta) => {
    try {
      const ventaActualizada = {
        ...venta,
        montoAbonado: venta.total,
        saldoPendiente: 0
      };

      handleAbonarSaldo(ventaActualizada);
      toast.success('Deuda solventada completamente');
    } catch (error) {
      toast.error('Error al solventar la deuda');
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <HeaderTitle>
        <AttachMoney fontSize="inherit" />
        {clienteSeleccionado?.nombre || 'Cliente no seleccionado'}
      </HeaderTitle>

      <DialogContent sx={{ py: 3 }}>
        {loading ? (
          <Box textAlign="center" p={4}>
            <CircularProgress />
            <Typography mt={2}>Cargando datos del cliente...</Typography>
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <InfoItem label="RIF" value={clienteSeleccionado?.rif} icon={<Payment />} />
              <InfoItem label="Teléfono" value={clienteSeleccionado?.telefono} icon={<Payment />} />
              <InfoItem label="Email" value={clienteSeleccionado?.email} icon={<Payment />} />
              <InfoItem label="Dirección" value={clienteSeleccionado?.direccion} icon={<Payment />} />
              <InfoItem label="Municipio" value={clienteSeleccionado?.municipio} icon={<Payment />} />
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              <CheckCircle fontSize="small" sx={{ mr: 1 }} />
              Historial de Ventas del Cliente
            </Typography>

            {ventas.length > 0 ? (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      {['Fecha', 'Total', 'Abonado', 'Saldo', 'Acciones'].map((header) => (
                        <TableCell key={header} sx={{ fontWeight: 600 }}>
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  
                  <TableBody>
                    {ventas.map(venta => (
                      <TableRow key={venta._id || venta.id} hover>
                        <TableCell>{moment(venta.fecha).format('DD/MM/YYYY HH:mm')}</TableCell>
                        <TableCell>${(venta.total || 0).toFixed(2)}</TableCell>
                        <TableCell>${(venta.montoAbonado || 0).toFixed(2)}</TableCell>
                        <TableCell sx={{ 
                          color: (venta.saldoPendiente || 0) > 0 ? 'error.main' : 'success.main',
                          fontWeight: 500
                        }}>
                          ${(venta.saldoPendiente || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {(venta.saldoPendiente || 0) > 0 && (
                            <Box display="flex" gap={1} alignItems="center">
                              <TextField
                                type="number"
                                size="small"
                                value={montosAbono[venta._id || venta.id] || ''}
                                onChange={(e) => handleMontoChange(venta._id || venta.id, parseFloat(e.target.value))}
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                  inputProps: { 
                                    min: 0,
                                    max: venta.saldoPendiente,
                                    step: 0.01
                                  }
                                }}
                                sx={{ width: 120 }}
                              />
                              <Button 
                                variant="contained" 
                                onClick={() => handleAbonar(venta)}
                                disabled={!montosAbono[venta._id || venta.id]}
                              >
                                Abonar
                              </Button>
                              <Button 
                                variant="outlined" 
                                color="success" 
                                onClick={() => handleSolventarDeuda(venta)}
                              >
                                Pagar Total
                              </Button>
                            </Box>
                          )}
                          {(venta.saldoPendiente || 0) <= 0 && (
                            <Chip 
                              label="Pagado" 
                              color="success" 
                              size="small" 
                              sx={{ fontWeight: 'bold' }}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Box textAlign="center" p={4}>
                <Typography variant="body1" color="textSecondary">
                  No hay ventas registradas para este cliente
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 2 }}>
              <Typography variant="h6">
                Deuda Total: $
                <Box component="span" color={calcularDeudaTotal() > 0 ? 'error.main' : 'success.main'}>
                  {calcularDeudaTotal().toFixed(2)}
                </Box>
              </Typography>
            </Box>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>

      {mostrarGenerarFactura && (
        <GenerarFactura 
          venta={ventaSeleccionada} 
          onClose={() => setMostrarGenerarFactura(false)} 
        />
      )}
    </StyledDialog>
  );
};

export default RegistroClienteDialog;