import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Grid, Typography, TableContainer, Table, TableHead, 
  TableRow, TableCell, TableBody, Chip, TextField, 
  Button, IconButton, Box, Divider, InputAdornment, Paper, CircularProgress, useMediaQuery, useTheme
} from '@mui/material';
import { Print, AttachMoney, CheckCircle, Payment } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import GenerarFactura from './GenerarFactura.jsx'; // Importar el componente GenerarFactura
import axios from 'axios';
import moment from 'moment';
import { toast } from 'react-hot-toast';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';

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
  const [nombre, setNombre] = useState(clienteSeleccionado?.nombre || '');
  const [telefono, setTelefono] = useState(clienteSeleccionado?.telefono || '');
  const [direccion, setDireccion] = useState(clienteSeleccionado?.direccion || '');
  const theme = useTheme();

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

  // Transición para diálogo móvil
  const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
  });

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      // Pantalla completa en móviles
      fullScreen={useMediaQuery(theme.breakpoints.down('sm'))}
      // Transición suave en móviles
      TransitionComponent={useMediaQuery(theme.breakpoints.down('sm')) ? Transition : undefined}
    >
      <DialogTitle>
        {clienteSeleccionado ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
        {/* Botón de cerrar para móviles */}
        {useMediaQuery(theme.breakpoints.down('sm')) && (
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </DialogTitle>
      
      <DialogContent dividers>
        {/* Información del Cliente - Layout Responsivo */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Nombre"
              fullWidth
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              margin="dense"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Teléfono"
              fullWidth
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              margin="dense"
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Dirección"
              fullWidth
              multiline
              rows={2}
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              margin="dense"
              variant="outlined"
            />
          </Grid>
        </Grid>
        
        {/* Sección de ventas pendientes - Responsiva */}
        {clienteSeleccionado && ventasActualizadas.length > 0 && (
          <Box mt={3}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'flex-start', sm: 'center' },
                gap: 1
              }}
            >
              Ventas Pendientes
              <Chip 
                label={`Total: $${deudaTotalCalculada.toFixed(2)}`}
                color="error"
                size="small"
                sx={{ 
                  fontWeight: 'bold',
                  ml: { sm: 2 }
                }}
              />
            </Typography>
            
            {/* Tabla Scrolleable Horizontal para Móviles */}
            <TableContainer 
              component={Paper} 
              variant="outlined"
              sx={{ 
                maxHeight: { xs: '40vh', md: '50vh' },
                overflowX: 'auto' 
              }}
            >
              <Table 
                size={useMediaQuery(theme.breakpoints.down('sm')) ? "small" : "medium"}
                stickyHeader
              >
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Fecha</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Folio</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Total</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Pendiente</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Abono</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ventasActualizadas.map((venta) => (
                    <TableRow key={venta._id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        {new Date(venta.fecha).toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{venta.folio}</TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        ${venta.total.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        ${venta.saldoPendiente.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap', minWidth: '120px' }}>
                        {/* Campo de abono - mantener funcionalidad */}
                        <TextField
                          type="number"
                          size="small"
                          value={montosAbono[venta._id] || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value >= 0 && value <= venta.saldoPendiente) {
                              handleMontoChange(venta._id, value);
                            }
                          }}
                          sx={{ 
                            width: { xs: '100%', sm: 120 }, 
                            minWidth: '80px' 
                          }}
                          InputProps={{
                            startAdornment: <AttachMoney fontSize="small" color="action" />,
                            inputProps: { 
                              min: 0, 
                              max: venta.saldoPendiente,
                              step: 0.01
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions sx={{ 
        flexDirection: { xs: 'column', sm: 'row' },
        py: { xs: 2, sm: 1 }
      }}>
        <Button 
          onClick={onClose}
          fullWidth={useMediaQuery(theme.breakpoints.down('sm'))}
          sx={{ mb: { xs: 1, sm: 0 } }}
        >
          Cancelar
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          color="primary"
          disabled={loading}
          fullWidth={useMediaQuery(theme.breakpoints.down('sm'))}
        >
          {loading ? <CircularProgress size={24} /> : 'Guardar'}
        </Button>
      </DialogActions>

      {/* Diálogo para Generar Factura */}
      {mostrarGenerarFactura && (
        <GenerarFactura 
          venta={ventaSeleccionada} 
          onClose={handleCerrarGenerarFactura} 
        />
      )}
    </Dialog>
  );
};

export default RegistroClienteDialog;