import React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Grid, Typography, TableContainer, Table, TableHead,
  TableRow, TableCell, TableBody, Paper, TextField,
  FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ConfirmarPagoModal = ({
  open,
  onClose,
  fechaVenta,
  setFechaVenta,
  nrFactura,
  setNrFactura,
  tipoPago,
  setTipoPago,
  metodoPago,
  setMetodoPago,
  banco,
  setBanco,
  montoAbonar,
  setMontoAbonar,
  totalVenta,
  errorFecha,
  setErrorFecha,
  errorFactura,
  setErrorFactura,
  errorMonto,
  setErrorMonto,
  errorBanco,
  setErrorBanco,
  productosVenta,
  handleConfirmarPago
}) => {
  // Función para calcular ganancias
  const calcularGanancias = (productos) => {
    return productos.map(producto => {
      const precioVenta = parseFloat(producto.precioVenta) || 0;
      const costoFinal = parseFloat(producto.costoFinal) || 0;

      const gananciaUnitaria = precioVenta - costoFinal;
      const gananciaTotal = gananciaUnitaria * (producto.cantidad || 0);

      return {
        ...producto,
        gananciaUnitaria,
        gananciaTotal
      };
    });
  };

  // Calcular ganancias
  const ganancias = calcularGanancias(productosVenta);

  // Función para confirmar el pago
  const confirmarPago = () => {
    // Validaciones
    if (!fechaVenta) {
      setErrorFecha('La fecha de venta es obligatoria');
      return;
    }
    if (!nrFactura) {
      setErrorFactura('El número de factura es obligatorio');
      return;
    }
    
    if (metodoPago !== 'efectivo' && !banco) {
      setErrorBanco('El banco es obligatorio');
      return;
    }

    // Pasar datos al componente padre
    handleConfirmarPago({
      fechaVenta,
      nrFactura,
      tipoPago,
      metodoPago,
      banco,
      montoAbonar
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
        Confirmar Método de Pago
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Fecha de Venta"
              type="date"
              value={fechaVenta}
              onChange={(e) => {
                setFechaVenta(e.target.value);
                setErrorFecha('');
              }}
              InputLabelProps={{ shrink: true }}
              error={!!errorFecha}
              helperText={errorFecha}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Número de Factura"
              value={nrFactura}
              onChange={(e) => {
                setNrFactura(e.target.value);
                setErrorFactura('');
              }}
              error={!!errorFactura}
              helperText={errorFactura}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Pago</InputLabel>
              <Select
                value={tipoPago}
                onChange={(e) => setTipoPago(e.target.value)}
              >
                <MenuItem value="contado">Contado</MenuItem>
                <MenuItem value="credito">Crédito</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Método de Pago</InputLabel>
              <Select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                label="Método de Pago"
              >
                <MenuItem value="efectivo">Efectivo</MenuItem>
                <MenuItem value="transferencia">Transferencia</MenuItem>
                <MenuItem value="pago_movil">Pago Móvil</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {metodoPago !== 'efectivo' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Banco"
                value={banco}
                onChange={(e) => {
                  setBanco(e.target.value);
                  setErrorBanco('');
                }}
                error={!!errorBanco}
                helperText={errorBanco}
              />
            </Grid>
          )}

          {tipoPago === 'credito' && (
            <>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Monto Abonado"
                  type="number"
                  value={montoAbonar}
                  onChange={(e) => {
                    setMontoAbonar(e.target.value);
                    setErrorMonto('');
                  }}
                  inputProps={{ min: 0, max: totalVenta }}
                  error={!!errorMonto}
                  helperText={errorMonto}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Saldo Pendiente"
                  type="number"
                  value={totalVenta - (Number(montoAbonar) || 0)}
                  disabled
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>Detalle de Ganancias</Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Producto</TableCell>
                    <TableCell align="right">Ganancia Unitaria</TableCell>
                    <TableCell align="right">Ganancia Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {ganancias.map((producto, index) => (
                    <TableRow key={index}>
                      <TableCell>{producto.nombre}</TableCell>
                      <TableCell align="right">${producto.gananciaUnitaria.toFixed(2)}</TableCell>
                      <TableCell align="right">${producto.gananciaTotal.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button onClick={confirmarPago} variant="contained" color="primary">
          Confirmar Pago
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmarPagoModal;