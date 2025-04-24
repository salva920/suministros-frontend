import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, Typography, Paper, IconButton, Box, InputAdornment, useMediaQuery, Divider, MenuItem, FormControl, FormHelperText, CircularProgress
} from '@mui/material';
import { Close, ArrowBack, Inventory, MonetizationOn, LocalShipping, Calculator } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { styled, useTheme } from '@mui/material/styles';
import axios from 'axios';
import moment from 'moment';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

// Componentes estilizados
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const RoundedButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: theme.spacing(1.5, 3),
  textTransform: 'none',
  fontSize: '1rem',
}));

const AgregarProducto = ({ open, onClose, productoEditando, onProductoGuardado, agregarProductoAlEstado }) => {
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [producto, setProducto] = useState({
    _id: '',
    nombre: '',
    codigo: '',
    proveedor: '',
    costoInicial: '',
    acarreo: '',
    flete: '',
    cantidad: '',
    stock: 0,
    fechaIngreso: ''
  });

  const [errores, setErrores] = useState({
    nombre: false,
    codigo: false,
    costoInicial: false,
    cantidad: false
  });

  const [costoFinal, setCostoFinal] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productoEditando) {
      setProducto({
        _id: productoEditando._id,
        nombre: productoEditando.nombre || '',
        codigo: productoEditando.codigo || '',
        proveedor: productoEditando.proveedor || '',
        costoInicial: productoEditando.costoInicial || '',
        acarreo: productoEditando.acarreo || '',
        flete: productoEditando.flete || '',
        cantidad: productoEditando.cantidad || '',
        stock: productoEditando.stock || 0,
        fechaIngreso: productoEditando.fechaIngreso ? 
          moment(productoEditando.fechaIngreso).format('YYYY-MM-DD') : ''
      });
    } else {
      resetForm();
    }
  }, [productoEditando]);

  useEffect(() => {
    const calcularCostoFinal = () => {
      const costoInicialNum = producto.costoInicial === '' ? 0 : parseFloat(producto.costoInicial);
      const acarreoNum = producto.acarreo === '' ? 0 : parseFloat(producto.acarreo);
      const fleteNum = producto.flete === '' ? 0 : parseFloat(producto.flete);
      
      const total = costoInicialNum + acarreoNum + fleteNum;
      setCostoFinal(total);
    };
    
    calcularCostoFinal();
  }, [producto.costoInicial, producto.acarreo, producto.flete]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProducto(prev => {
      let processedValue = value;
      
      // Manejo de campos numéricos
      if (['costoInicial', 'acarreo', 'flete', 'cantidad'].includes(name)) {
        processedValue = value === '' ? '' : Math.max(0, Number(value.replace(/[^0-9.]/g, '')));
        if (name === 'cantidad' && processedValue < 1) processedValue = 1;
      }
      
      // Validación en tiempo real para campos de texto
      if (name === 'nombre' || name === 'codigo') {
        processedValue = value.trimStart().replace(/\s{2,}/g, ' ');
      }

      // Actualizar errores en tiempo real
      setErrores(prevErrores => ({
        ...prevErrores,
        [name]: !processedValue || (typeof processedValue === 'number' && processedValue <= 0)
      }));

      return { ...prev, [name]: processedValue };
    });
  };

  const resetForm = () => {
    setProducto({
      _id: '',
      nombre: '',
      codigo: '',
      proveedor: '',
      costoInicial: '',
      acarreo: '',
      flete: '',
      cantidad: '',
      stock: 0,
      fechaIngreso: ''
    });
    setErrores({
      nombre: false,
      codigo: false,
      costoInicial: false,
      cantidad: false
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Evitar múltiples envíos
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true); // Indicar que está en proceso de envío
      
      // Trimmeo de código antes de validar
      const codigoTrimmed = producto.codigo.trim();

      // Validación final antes de enviar
      const validationErrors = [];
      if (!producto.nombre.trim()) validationErrors.push('nombre');
      if (!codigoTrimmed) validationErrors.push('código');
      if (!producto.costoInicial || producto.costoInicial <= 0) validationErrors.push('costo inicial');
      if (!producto.cantidad || producto.cantidad <= 0) validationErrors.push('cantidad');
      if (!producto.fechaIngreso) validationErrors.push('fecha de ingreso');

      if (validationErrors.length > 0) {
        toast.error(`Errores en: ${validationErrors.join(', ')}`);
        setIsSubmitting(false);
        return;
      }
      
      // Conversión a fecha UTC antes de enviar
      const fechaUTC = moment.utc(producto.fechaIngreso).startOf('day').toISOString();
        
      // Verificar si estamos en modo edición
      const esModoEdicion = !!productoEditando;
      const productoId = esModoEdicion ? (productoEditando._id || productoEditando.id) : null;
        
      // Construir datos del producto con valores seguros
      const productData = {
        nombre: producto.nombre.trim(),
        codigo: codigoTrimmed,
        proveedor: producto.proveedor?.trim() || '',
        costoInicial: parseFloat(producto.costoInicial) || 0,
        acarreo: parseFloat(producto.acarreo) || 0,
        flete: parseFloat(producto.flete) || 0,
        cantidad: parseInt(producto.cantidad, 10) || 0,
        costoFinal: parseFloat(producto.costoFinal) || 0,
        fechaIngreso: fechaUTC
      };
      
      // En modo creación, incluir el stock inicial
      if (!esModoEdicion) {
        productData.stock = parseInt(producto.cantidad, 10) || 0;
      }
      
      // En modo edición, incluir el ID
      if (esModoEdicion && productoId) {
        productData._id = productoId;
      }
      
      console.log("Enviando datos:", productData);
      
      let response;
      if (esModoEdicion && productoId) {
        response = await axios.put(`${API_URL}/productos/${productoId}`, productData);
      } else {
        response = await axios.post(`${API_URL}/productos`, productData);
      }

      // Solo mostrar una notificación de éxito
      if (response.status === 200 || response.status === 201) {
        // Solo notificar una vez
        toast.success(esModoEdicion ? 'Producto actualizado correctamente' : 'Producto agregado correctamente');
        
        // Llamar al callback una sola vez
        if (typeof onProductoGuardado === 'function') {
          onProductoGuardado(response.data);
        }
        
        // Resetear el formulario y cerrar el modal
        resetForm();
        if (typeof onClose === 'function') {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error al guardar el producto:', error);
      const mensajeError = error.response?.data?.message || 'Error al guardar el producto';
      toast.error(mensajeError);
    } finally {
      setIsSubmitting(false); // Restablecer el estado de envío
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledPaper component="form" onSubmit={handleSubmit}>
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          backgroundColor: 'primary.main',
          color: 'common.white',
          borderRadius: '12px 12px 0 0',
          p: 3,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Inventory fontSize="large" />
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              {productoEditando ? 'Editar Producto' : 'Nuevo Producto'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'common.white' }}>
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nombre"
                name="nombre"
                value={producto.nombre}
                onChange={handleChange}
                fullWidth
                required
                error={errores.nombre}
                helperText={errores.nombre && "Nombre es requerido"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Código"
                name="codigo"
                value={producto.codigo}
                onChange={handleChange}
                fullWidth
                required
                error={errores.codigo}
                helperText={errores.codigo && "Código es requerido"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Proveedor"
                name="proveedor"
                value={producto.proveedor}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Costo Inicial"
                name="costoInicial"
                value={producto.costoInicial}
                onChange={handleChange}
                fullWidth
                required
                type="number"
                inputProps={{ min: 0.01, step: 0.01 }}
                error={errores.costoInicial}
                helperText={errores.costoInicial && "Debe ser mayor a 0"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Acarreo"
                name="acarreo"
                value={producto.acarreo}
                onChange={handleChange}
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Flete"
                name="flete"
                value={producto.flete}
                onChange={handleChange}
                fullWidth
                type="number"
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Cantidad"
                name="cantidad"
                value={producto.cantidad}
                onChange={handleChange}
                fullWidth
                required
                type="number"
                inputProps={{ min: 1 }}
                error={errores.cantidad}
                helperText={errores.cantidad && "Debe ser mayor a 0"}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Fecha de Ingreso"
                name="fechaIngreso"
                type="date"
                value={producto.fechaIngreso}
                onChange={handleChange}
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
                inputProps={{
                  max: moment().format('YYYY-MM-DD')
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3 }}>
          <RoundedButton 
            variant="outlined" 
            onClick={onClose}
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            Volver
          </RoundedButton>
          <RoundedButton 
            type="submit"
            variant="contained" 
            color="primary" 
            size="large"
          >
            {productoEditando ? 'Actualizar Producto' : 'Guardar Producto'}
          </RoundedButton>
        </DialogActions>
      </StyledPaper>
    </Dialog>
  );
};

export default AgregarProducto;
