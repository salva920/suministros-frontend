import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, Typography, Paper, IconButton, Box
} from '@mui/material';
import { Close, ArrowBack, Inventory } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { styled } from '@mui/material/styles';
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
  
  const [producto, setProducto] = useState({
    _id: '',
    nombre: '',
    codigo: '',
    proveedor: '',
    costoInicial: 0,
    acarreo: 0,
    flete: 0,
    cantidad: 0,
    stock: 0,
    fechaIngreso: ''
  });

  const [errores, setErrores] = useState({
    nombre: false,
    codigo: false,
    costoInicial: false,
    cantidad: false
  });

 

  useEffect(() => {
    if (productoEditando) {
      setProducto({
        _id: productoEditando._id,
        nombre: productoEditando.nombre || '',
        codigo: productoEditando.codigo || '',
        proveedor: productoEditando.proveedor || '',
        costoInicial: productoEditando.costoInicial || 0,
        acarreo: productoEditando.acarreo || 0,
        flete: productoEditando.flete || 0,
        cantidad: productoEditando.cantidad || 0,
        stock: productoEditando.stock || 0,
        fechaIngreso: productoEditando.fechaIngreso ? 
          moment(productoEditando.fechaIngreso).format('YYYY-MM-DD') : ''
      });
    } else {
      resetForm();
    }
  }, [productoEditando]);

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
      costoInicial: 0,
      acarreo: 0,
      flete: 0,
      cantidad: 0,
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
    try {
      // Trimmeo de código antes de validar
      const codigoTrimmed = producto.codigo.trim();

      // Validación final antes de enviar
      const validationErrors = [];
      if (!producto.nombre.trim()) validationErrors.push('nombre');
      if (!codigoTrimmed) validationErrors.push('código');
      if (producto.costoInicial <= 0) validationErrors.push('costo inicial');
      if (producto.cantidad <= 0) validationErrors.push('cantidad');
      if (!producto.fechaIngreso) validationErrors.push('fecha de ingreso');

      if (validationErrors.length > 0) {
        toast.error(`Errores en: ${validationErrors.join(', ')}`);
        return;
      }

      // Cálculo final seguro
      const costoFinal = Number(
        ((producto.costoInicial * producto.cantidad + producto.acarreo + producto.flete) / producto.cantidad).toFixed(2)
      );

      const productData = {
        nombre: producto.nombre.trim(),
        codigo: codigoTrimmed, // Usar el código trimmeado
        proveedor: producto.proveedor?.trim() || undefined,
        costoInicial: Number(producto.costoInicial),
        acarreo: Number(producto.acarreo),
        flete: Number(producto.flete),
        cantidad: Number(producto.cantidad),
        costoFinal,
        stock: Number(producto.cantidad),
        fechaIngreso: producto.fechaIngreso
      };

      let response;
      if (producto._id) {
        // Si el producto tiene un _id, está en modo de edición
        response = await axios.put(`${API_URL}/productos/${producto._id}`, productData);
      } else {
        // Si no tiene un _id, está en modo de creación
        response = await axios.post(`${API_URL}/productos`, {
          ...productData,
          stock: productData.cantidad // Asegurar que el stock inicial sea igual a la cantidad
        });
      }

      if (response.status === 200 || response.status === 201) {
        toast.success(producto._id ? 'Producto actualizado correctamente' : 'Producto agregado correctamente');
        onProductoGuardado(response.data);  // Usar datos reales del servidor
        resetForm();
        onClose();
        agregarProductoAlEstado(response.data);
      }
    } catch (error) {
      console.error('Error detallado:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });

      // Manejo específico de errores del campo 'codigo'
      if (error.response?.data?.field === 'codigo') {
        setErrores(prev => ({ ...prev, codigo: true }));
        toast.error(error.response.data.message);
      } else if (error.response?.data?.errors) {
        // Mostrar errores de validación del backend
        const errorMessages = error.response.data.errors.map(e => e.message).join(', ');
        toast.error(`Errores: ${errorMessages}`);
      } else {
        const errorMessage = error.response?.data?.message || 
          'Error al guardar el producto';
        toast.error(`Error: ${errorMessage}`);
      }
    }
  };

  const handleAgregarProducto = async () => {
    try {
      const response = await fetch('https://suministros-backend.vercel.app/api/productos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Si usas autenticación, añade el token aquí:
          // 'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          nombre: 'Ejemplo', 
          precio: 100 
        }),
      });

      if (!response.ok) throw new Error('Error en la respuesta');
      
      const data = await response.json();
      console.log('Producto agregado:', data);
    } catch (error) {
      console.error('Error al agregar producto:', error);
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