import React, { useState, useContext, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, Typography, MenuItem, 
  Paper, IconButton, Box, InputAdornment, Collapse, Divider
} from '@mui/material';
import { Close, ArrowBack, AttachMoney, Inventory, ExpandMore, ExpandLess } from '@mui/icons-material';
import { toast } from 'react-toastify';
import { TasaCambioContext } from '../../context/TasaCambioContext';
import { styled } from '@mui/material/styles';

// Componentes estilizados
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.background.paper,
}));

const SummaryPaper = styled(Paper)(({ theme }) => ({
  borderRadius: '8px',
  padding: theme.spacing(3),
  backgroundColor: theme.palette.grey[100],
  border: `1px solid ${theme.palette.divider}`,
}));

const CurrencyText = styled(Typography)(({ theme }) => ({
  fontWeight: '500',
  color: theme.palette.text.primary,
  '& .secondary': {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
}));

const RoundedButton = styled(Button)(({ theme }) => ({
  borderRadius: '8px',
  padding: theme.spacing(1.5, 3),
  textTransform: 'none',
  fontSize: '1rem',
}));

const SectionHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  cursor: 'pointer',
  '& .MuiTypography-root': {
    color: theme.palette.primary.main,
    fontWeight: 'bold',
  },
}));

const FormGrid = styled(Grid)(({ theme }) => ({
  marginTop: theme.spacing(1),
}));

const FormField = styled(TextField)(({ theme }) => ({
  borderRadius: '8px',
  '& .MuiInputBase-root': {
    borderRadius: '8px',
  },
}));

const AgregarProducto = ({ open, onClose, productoEditando, onProductoGuardado }) => {
  const { tasaPromedio } = useContext(TasaCambioContext);
  
  const [formData, setFormData] = useState({
    nombre: productoEditando?.nombre || '',
    codigo: productoEditando?.codigo || '',
    categoria: '',
    proveedor: '',
    costoInicial: productoEditando?.costoInicial || 0,  // Costo unitario inicial
    acarreo: productoEditando?.acarreo || 0,
    flete: productoEditando?.flete || 0,
    precio: productoEditando?.precio || 0,
    stock: productoEditando?.stock || 0,
  });

  const [expandedSections, setExpandedSections] = useState({
    infoBasica: true,
    costos: true,
    precio: true,
  });

  // Función para calcular el costo final unitario
  const calcularCostoFinal = () => {
    const costoUnitarioInicial = parseFloat(formData.costoInicial) || 0;
    const cantidad = parseFloat(formData.stock) || 1; // Evitar división por cero
    const acarreo = parseFloat(formData.acarreo) || 0;
    const flete = parseFloat(formData.flete) || 0;
    
    const costoTotal = (costoUnitarioInicial * cantidad) + acarreo + flete;
    const costoUnitarioFinal = costoTotal / cantidad;
    
    return Number(costoUnitarioFinal.toFixed(2));
  };

  // Calcula la ganancia unitaria
  const calcularGananciaUnitaria = () => {
    return Number(formData.precio) - calcularCostoFinal();
  };

  // Calcula la ganancia total
  const calcularGananciaTotal = () => {
    return calcularGananciaUnitaria() * Number(formData.stock);
  };

  useEffect(() => {
    if (productoEditando) {
      setFormData({
        ...productoEditando,
        costoInicial: productoEditando.costoInicial || 0,
        acarreo: productoEditando.acarreo || 0,
        flete: productoEditando.flete || 0,
      });
    } else {
      resetForm();
    }
  }, [productoEditando]);

  // Actualizar handleChange para incluir stock en los cálculos
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (['costoInicial', 'acarreo', 'flete', 'stock'].includes(name)) {
        const costoFinal = calcularCostoFinal();
        return { ...newData, costoFinal };
      }

      return newData;
    });
  };

  const resetForm = () => {
    setFormData({
      nombre: '',
      codigo: '',
      categoria: '',
      proveedor: '',
      costoInicial: 0,
      acarreo: 0,
      flete: 0,
      precio: 0,
      stock: 0,
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleGuardar = () => {
    // Validaciones
    if (!formData.nombre || !formData.codigo || !formData.costoInicial || !formData.precio || !formData.stock) {
      toast.error('Complete todos los campos requeridos');
      return;
    }

    // Crear o actualizar el producto
    const producto = {
      ...formData,
      id: productoEditando?.id || Date.now(),
      stock: Number(formData.stock),
      costoInicial: Number(formData.costoInicial),
      acarreo: Number(formData.acarreo),
      flete: Number(formData.flete),
      precio: Number(formData.precio),
      fechaIngreso: new Date().toLocaleString(),
      costoFinal: calcularCostoFinal(),
      gananciaUnitaria: calcularGananciaUnitaria(),
      gananciaTotal: calcularGananciaTotal()
    };

    // Pasar el producto al componente padre
    onProductoGuardado(producto);

    // Cerrar el formulario
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <StyledPaper>
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
          <form onSubmit={handleGuardar}>
            <FormGrid container spacing={3}>
              {/* Sección: Información Básica */}
              <Grid item xs={12}>
                <StyledPaper>
                  <SectionHeader onClick={() => toggleSection('infoBasica')}>
                    <Typography variant="h6">Información Básica</Typography>
                    {expandedSections.infoBasica ? <ExpandLess /> : <ExpandMore />}
                  </SectionHeader>
                  <Collapse in={expandedSections.infoBasica}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormField
                          fullWidth
                          label="Nombre del Producto *"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormField
                          fullWidth
                          label="Código Único *"
                          name="codigo"
                          value={formData.codigo}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormField
                          fullWidth
                          label="Categoría"
                          name="categoria"
                          value={formData.categoria}
                          onChange={handleChange}
                          select
                        >
                          {[
                            'Herramientas Manuales',
                            'Herramientas Eléctricas',
                            'Materiales de Construcción',
                            'Ferretería General',
                            'Pinturas y Accesorios',
                            'Plomeria',
                            'Electricidad',
                            'Cerraduras y Seguridad',
                            'Jardinería',
                            'Adhesivos y Sellantes'
                          ].map(opcion => (
                            <MenuItem key={opcion} value={opcion}>{opcion}</MenuItem>
                          ))}
                        </FormField>
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormField
                          fullWidth
                          label="Proveedor"
                          name="proveedor"
                          value={formData.proveedor}
                          onChange={handleChange}
                        />
                      </Grid>
                    </Grid>
                  </Collapse>
                </StyledPaper>
              </Grid>

              {/* Sección: Costos Actualizada */}
              <Grid item xs={12}>
                <StyledPaper>
                  <SectionHeader onClick={() => toggleSection('costos')}>
                    <Typography variant="h6">Cálculo de Costos (USD)</Typography>
                    {expandedSections.costos ? <ExpandLess /> : <ExpandMore />}
                  </SectionHeader>
                  <Collapse in={expandedSections.costos}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={4}>
                        <FormField
                          fullWidth
                          label="Costo Inicial por Unidad *"
                          name="costoInicial"
                          type="number"
                          value={formData.costoInicial}
                          onChange={handleChange}
                          required
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormField
                          fullWidth
                          label="Acarreo Total"
                          name="acarreo"
                          type="number"
                          value={formData.acarreo}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <FormField
                          fullWidth
                          label="Flete Total"
                          name="flete"
                          type="number"
                          value={formData.flete}
                          onChange={handleChange}
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                          }}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          Costo Final Unitario: ${calcularCostoFinal().toFixed(2)} USD
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Fórmula: [(${formData.costoInicial} × {formData.stock}) + ${formData.acarreo} + ${formData.flete}] ÷ {formData.stock}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Collapse>
                </StyledPaper>
              </Grid>

              {/* Sección: Precio y Stock */}
              <Grid item xs={12}>
                <StyledPaper>
                  <SectionHeader onClick={() => toggleSection('precio')}>
                    <Typography variant="h6">Precio y Stock</Typography>
                    {expandedSections.precio ? <ExpandLess /> : <ExpandMore />}
                  </SectionHeader>
                  <Collapse in={expandedSections.precio}>
                    <Divider sx={{ my: 2 }} />
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        <FormField
                          fullWidth
                          label="Precio de Venta *"
                          name="precio"
                          type="number"
                          value={formData.precio}
                          onChange={handleChange}
                          required
                          InputProps={{
                            startAdornment: <InputAdornment position="start">$</InputAdornment>,
                            endAdornment: `= ${(formData.precio * tasaPromedio).toFixed(2)} Bs`
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <FormField
                          fullWidth
                          label="Stock Disponible *"
                          name="stock"
                          type="number"
                          value={formData.stock}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                    </Grid>
                  </Collapse>
                </StyledPaper>
              </Grid>

              {/* Sección: Resumen */}
              <Grid item xs={12}>
                <SummaryPaper>
                  <Typography variant="h6" sx={{ mb: 2, color: 'primary.main', fontWeight: 'bold' }}>
                    Resumen Financiero
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <CurrencyText>
                        Ganancia Unitaria: ${calcularGananciaUnitaria().toFixed(2)}
                        <Typography component="span" className="secondary">
                          = {(calcularGananciaUnitaria() * tasaPromedio).toFixed(2)} Bs
                        </Typography>
                      </CurrencyText>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <CurrencyText>
                        Ganancia Total: ${calcularGananciaTotal().toFixed(2)}
                        <Typography component="span" className="secondary">
                          = {(calcularGananciaTotal() * tasaPromedio).toFixed(2)} Bs
                        </Typography>
                      </CurrencyText>
                    </Grid>
                  </Grid>
                </SummaryPaper>
              </Grid>
            </FormGrid>
          </form>
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
            variant="contained" 
            color="primary" 
            onClick={handleGuardar}
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