import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, Typography, TableContainer, Table, TableHead, 
  TableRow, TableCell, TableBody, Chip, TextField, 
  Button, IconButton, Box, Divider, InputAdornment, Paper, CircularProgress
} from '@mui/material';
import { Print, AttachMoney, CheckCircle, Payment, Edit } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import GenerarFactura from './GenerarFactura';
import EditarVentaDialog from './EditarVentaDialog';
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
  const [mostrarEditarVenta, setMostrarEditarVenta] = useState(false);

  // Actualizar ventas cuando cambia ventasCliente o clienteSeleccionado
  useEffect(() => {
    if (ventasCliente && clienteSeleccionado) {
      // Normalizar ID del cliente seleccionado
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
            nombre: v.cliente?.nombre || 'Cliente no disponible',
            rif: v.cliente?.rif || 'Sin RIF'
          },
          fecha: v.fecha ? new Date(v.fecha) : null,
          total: parseFloat(v.total || 0),
          montoAbonado: parseFloat(v.montoAbonado || 0),
          saldoPendiente: parseFloat(v.saldoPendiente || 0)
        }))
        .sort((a, b) => {
          const fechaA = a.fecha ? new Date(a.fecha) : new Date(0);
          const fechaB = b.fecha ? new Date(b.fecha) : new Date(0);
          return fechaB - fechaA;
        });
      
      setVentas(ventasFiltradas);
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
    const ventaId = venta._id || venta.id;
    if (!ventaId) {
      console.error('Error: ID de venta no disponible', venta);
      toast.error('Error: ID de venta no disponible');
      return;
    }

    const monto = montosAbono[ventaId];
    if (!monto || monto <= 0) return;

    try {
      setLoading(true);
      
      const nuevoAbonado = (venta.montoAbonado || 0) + monto;
      const nuevoSaldo = (venta.total || 0) - nuevoAbonado;

      const ventaActualizada = {
        _id: ventaId,
        cliente: venta.cliente?._id || venta.cliente,
        total: parseFloat(venta.total || 0),
        montoAbonado: parseFloat(nuevoAbonado),
        saldoPendiente: parseFloat(nuevoSaldo),
        estadoCredito: nuevoSaldo > 0 ? 'vigente' : 'pagado',
        tipoPago: venta.tipoPago,
        metodoPago: venta.metodoPago,
        productos: venta.productos?.map(p => ({
          producto: p.producto?._id || p.producto,
          cantidad: parseFloat(p.cantidad || 0),
          precioUnitario: parseFloat(p.precioUnitario || 0),
          gananciaUnitaria: parseFloat(p.gananciaUnitaria || 0),
          gananciaTotal: parseFloat(p.gananciaTotal || 0),
          costoInicial: parseFloat(p.costoInicial || 0)
        }))
      };

      console.log('Enviando datos al backend para abono:', ventaActualizada);

      const response = await axios.put(`${API_URL}/ventas/${ventaId}`, ventaActualizada);
      
      if (response.data) {
        setMontosAbono(prev => ({ ...prev, [ventaId]: '' }));
        setVentas(prev => prev.map(v => 
          (v._id || v.id) === ventaId ? response.data : v
        ));
      toast.success(`Abono de $${monto.toFixed(2)} registrado`);
        return true;
      }
    } catch (error) {
      console.error('Error al procesar abono:', error);
      console.error('Detalles del error:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        estado: error.response?.status
      });
      toast.error(error.response?.data?.error || 'Error al procesar el abono');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleSolventarDeuda = async (venta) => {
    const ventaId = venta._id || venta.id;
    if (!ventaId) {
      console.error('Error: ID de venta no disponible', venta);
      toast.error('Error: ID de venta no disponible');
      return;
    }

    try {
      setLoading(true);
      
      const ventaActualizada = {
        _id: ventaId,
        cliente: venta.cliente?._id || venta.cliente,
        total: parseFloat(venta.total || 0),
        montoAbonado: parseFloat(venta.total || 0),
        saldoPendiente: 0,
        estadoCredito: 'pagado',
        tipoPago: venta.tipoPago,
        metodoPago: venta.metodoPago,
        productos: venta.productos?.map(p => ({
          producto: p.producto?._id || p.producto,
          cantidad: parseFloat(p.cantidad || 0),
          precioUnitario: parseFloat(p.precioUnitario || 0),
          gananciaUnitaria: parseFloat(p.gananciaUnitaria || 0),
          gananciaTotal: parseFloat(p.gananciaTotal || 0),
          costoInicial: parseFloat(p.costoInicial || 0)
        }))
      };

      console.log('Enviando datos al backend para solventar deuda:', ventaActualizada);

      const response = await axios.put(`${API_URL}/ventas/${ventaId}`, ventaActualizada);
      
      if (response.data) {
        setVentas(prev => prev.map(v => 
          (v._id || v.id) === ventaId ? response.data : v
        ));
      toast.success('Deuda solventada completamente');
        return true;
      }
    } catch (error) {
      console.error('Error al solventar deuda:', error);
      console.error('Detalles del error:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        estado: error.response?.status
      });
      toast.error(error.response?.data?.error || 'Error al solventar la deuda');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleEditarVenta = (venta) => {
    setVentaSeleccionada(venta);
    setMostrarEditarVenta(true);
  };

  const handleVentaActualizada = (ventaActualizada) => {
    setVentas(prev => prev.map(v => 
      v._id === ventaActualizada._id ? ventaActualizada : v
    ));
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
                          <Box display="flex" gap={1} alignItems="center">
                            {(venta.saldoPendiente || 0) > 0 && (
                              <>
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
                              </>
                        )}
                            {(venta.saldoPendiente || 0) <= 0 && (
                          <Chip 
                            label="Pagado" 
                            color="success" 
                            size="small" 
                            sx={{ fontWeight: 'bold' }}
                          />
                        )}
                            <IconButton
                              onClick={() => handleEditarVenta(venta)}
                              color="primary"
                              sx={{ 
                                '&:hover': {
                                  backgroundColor: 'primary.light',
                                  color: 'white'
                                }
                              }}
                            >
                              <Edit />
                            </IconButton>
                          </Box>
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

      {mostrarEditarVenta && (
        <EditarVentaDialog
          open={mostrarEditarVenta}
          onClose={() => setMostrarEditarVenta(false)}
          venta={ventaSeleccionada}
          onVentaActualizada={handleVentaActualizada}
        />
      )}
    </StyledDialog>
  );
};

export default RegistroClienteDialog;