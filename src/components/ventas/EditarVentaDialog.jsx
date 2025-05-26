import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  Typography,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import { styled } from '@mui/material/styles';
import axios from 'axios';
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
  },
}));

const EditarVentaDialog = ({ open, onClose, venta, onVentaActualizada }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    total: '',
    montoAbonado: '',
    saldoPendiente: '',
    tipoPago: '',
    metodoPago: ''
  });

  useEffect(() => {
    if (venta) {
      setFormData({
        total: venta.total || 0,
        montoAbonado: venta.montoAbonado || 0,
        saldoPendiente: venta.saldoPendiente || 0,
        tipoPago: venta.tipoPago || '',
        metodoPago: venta.metodoPago || ''
      });
    }
  }, [venta]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Calcular saldo pendiente automáticamente
    if (name === 'total' || name === 'montoAbonado') {
      const total = name === 'total' ? parseFloat(value) : parseFloat(formData.total);
      const montoAbonado = name === 'montoAbonado' ? parseFloat(value) : parseFloat(formData.montoAbonado);
      const saldoPendiente = total - montoAbonado;
      
      setFormData(prev => ({
        ...prev,
        saldoPendiente: saldoPendiente.toFixed(2)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ventaActualizada = {
        ...venta,
        total: parseFloat(formData.total),
        montoAbonado: parseFloat(formData.montoAbonado),
        saldoPendiente: parseFloat(formData.saldoPendiente),
        tipoPago: formData.tipoPago,
        metodoPago: formData.metodoPago,
        estadoCredito: parseFloat(formData.saldoPendiente) > 0 ? 'vigente' : 'pagado'
      };

      const response = await axios.put(`${API_URL}/ventas/${venta._id}`, ventaActualizada);

      if (response.data) {
        toast.success('Venta actualizada correctamente');
        onVentaActualizada(response.data);
        onClose();
      }
    } catch (error) {
      console.error('Error al actualizar venta:', error);
      toast.error(error.response?.data?.error || 'Error al actualizar la venta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <HeaderTitle>
        Editar Venta
      </HeaderTitle>

      <DialogContent sx={{ py: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Total"
                  name="total"
                  type="number"
                  value={formData.total}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Monto Abonado"
                  name="montoAbonado"
                  type="number"
                  value={formData.montoAbonado}
                  onChange={handleChange}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Saldo Pendiente"
                  name="saldoPendiente"
                  type="number"
                  value={formData.saldoPendiente}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  disabled
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tipo de Pago"
                  name="tipoPago"
                  value={formData.tipoPago}
                  onChange={handleChange}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Método de Pago"
                  name="metodoPago"
                  value={formData.metodoPago}
                  onChange={handleChange}
                  required
                />
              </Grid>
            </Grid>
          </form>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} variant="outlined" color="primary">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={loading}
        >
          Guardar Cambios
        </Button>
      </DialogActions>
    </StyledDialog>
  );
};

export default EditarVentaDialog; 