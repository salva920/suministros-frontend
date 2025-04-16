import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, Typography, TableContainer, Table, TableHead, 
  TableRow, TableCell, TableBody, Chip, TextField, 
  Button, IconButton, Box, Divider
} from '@mui/material';
import { Print, AttachMoney, CheckCircle, Payment } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import GenerarFactura from './GenerarFactura.jsx'; // Importar el componente GenerarFactura
import axios from 'axios';
import moment from 'moment';

// Definir la URL de la API
const API_URL = 'http://localhost:5000/api';

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

  // Actualizar ventasActualizadas cuando cambien las ventasCliente
  useEffect(() => {
    setVentasActualizadas(ventasCliente);
  }, [ventasCliente]);

  useEffect(() => {
    const calcularDeuda = () => {
      const total = ventasCliente.reduce(
        (acc, venta) => acc + (venta.saldoPendiente || 0), 0
      );
      setDeudaTotalCalculada(total);
    };
    calcularDeuda();
  }, [ventasCliente]);

  // Manejar cambio en los inputs de abono
  const handleMontoChange = (ventaId, monto) => {
    setMontosAbono(prev => ({
      ...prev,
      [ventaId]: Number(monto)
    }));
  };

  // Abonar a una venta específica
  const handleAbonar = async (venta) => {
    const monto = montosAbono[venta._id] || 0;
    if (monto > 0 && monto <= venta.saldoPendiente) {
      const ventaActualizada = {
        ...venta,
        montoAbonado: venta.montoAbonado + monto,
        saldoPendiente: venta.saldoPendiente - monto
      };
      
      try {
        await axios.put(`${API_URL}/ventas/${venta._id}`, ventaActualizada);
        handleAbonarSaldo(ventaActualizada); // Notificar al componente padre
        setMontosAbono(prev => ({ ...prev, [venta._id]: 0 })); // Reiniciar el monto de abono
        setVentasActualizadas(prevVentas => 
          prevVentas.map(v => 
            v._id === venta._id ? ventaActualizada : v
          )
        );
      } catch (error) {
        console.error('Error al abonar:', error);
      }
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
                          onChange={(e) => handleMontoChange(venta._id, e.target.value)}
                          sx={{ width: 100 }}
                          inputProps={{ 
                            min: 0, 
                            max: venta.saldoPendiente,
                            style: { textAlign: 'right' }
                          }}
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