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
  onDataUpdated
}) => {
  const [ventas, setVentas] = useState([]);
  const [montosAbono, setMontosAbono] = useState({});
  const [mostrarGenerarFactura, setMostrarGenerarFactura] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar ventas al abrir el diálogo
  useEffect(() => {
    const cargarVentasPendientes = async () => {
      if (open && clienteSeleccionado?.id) {  
        try {
          setLoading(true);
          
          const response = await axios.get(`${API_URL}/ventas`, {
            params: {
              cliente: clienteSeleccionado.id, // ✅ Enviar id
              limit: 1000
            }
          });

          if (response.data?.ventas) {
            setVentas(response.data.ventas);
            inicializarMontosAbono(response.data.ventas);
          }
          
        } catch (error) {
          console.error('Error cargando ventas:', error);
          toast.error(`Error: ${error.response?.data?.message || error.message}`);
        } finally {
          setLoading(false);
        }
      }
    };
    
    if (open) cargarVentasPendientes();
  }, [open, clienteSeleccionado?.id]);

  const inicializarMontosAbono = (ventas) => {
    const iniciales = ventas.reduce((acc, venta) => ({
      ...acc,
      [venta.id]: 0
    }), {});
    setMontosAbono(iniciales);
  };

  const calcularDeudaTotal = () => {
    return ventas.reduce((total, venta) => total + (venta.saldoPendiente || 0), 0);
  };

  const handleMontoChange = (ventaId, valor) => {
    setMontosAbono(prev => ({
      ...prev,
      [ventaId]: Math.max(0, Math.min(valor, ventas.find(v => v.id === ventaId).saldoPendiente)) // ✅ Cambiar _id por id
    }));
  };

  const handleAbonar = async (venta) => {
    const monto = montosAbono[venta.id];
    if (!monto || monto <= 0) return;

    try {
      const { data: ventaActualizada } = await axios.put(`${API_URL}/ventas/${venta.id}`, { // ✅ Cambiar _id por id

        montoAbonado: venta.montoAbonado + monto,
        saldoPendiente: venta.saldoPendiente - monto
      });

      setVentas(prev => prev.map(v => 
        v.id === venta.id ? ventaActualizada : v // ✅ Cambiar _id por id
      ));
      
      onDataUpdated?.();
      toast.success(`Abono de $${monto.toFixed(2)} registrado`);
    } catch (error) {
      toast.error('Error al procesar el abono');
    }
  };

  const handleSolventarDeuda = async (venta) => {
    try {
      const { data: ventaActualizada } = await axios.put(`${API_URL}/ventas/${venta.id}`, { // ✅ Cambiar _id por id

        montoAbonado: venta.total,
        saldoPendiente: 0
      });

      setVentas(prev => prev.map(v => 
        v.id === venta.id ? ventaActualizada : v // ✅ Cambiar _id por id
      ));
      
      onDataUpdated?.();
      toast.success('Deuda solventada completamente');
    } catch (error) {
      toast.error('Error al solventar la deuda');
    }
  };

  // Agregar console.log para depuración
  useEffect(() => {
    console.log('Cliente:', clienteSeleccionado);
    console.log('Ventas:', ventas);
  }, [clienteSeleccionado, ventas]); // Se ejecuta cada vez que cambian

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
              Historial de Ventas Pendientes
            </Typography>

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
                    <TableRow key={venta.id} hover>
                      <TableCell>{moment(venta.fecha).format('DD/MM/YYYY HH:mm')}</TableCell>
                      <TableCell>${venta.total.toFixed(2)}</TableCell>
                      <TableCell>${venta.montoAbonado.toFixed(2)}</TableCell>
                      <TableCell sx={{ 
                        color: venta.saldoPendiente > 0 ? 'error.main' : 'success.main',
                        fontWeight: 500
                      }}>
                        ${venta.saldoPendiente.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Box display="flex" gap={1} alignItems="center">
                          <TextField
                            type="number"
                            size="small"
                            value={montosAbono[venta.id] || 0}
                            onChange={(e) => handleMontoChange(venta.id, parseFloat(e.target.value))}
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
                            disabled={!montosAbono[venta.id]}
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

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