import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppBar, Toolbar, Typography, Container, Grid, 
  Paper, TextField, IconButton, Button, Card, 
  CardContent, CircularProgress, Box, Divider, LinearProgress,
  Tooltip, Avatar, useTheme, useMediaQuery, Chip
} from '@mui/material';
import logoRomero from '../logoRomero.png';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ExitToApp, Search, PointOfSale, 
  Inventory, Settings, People, AccountBalanceWallet, Assessment, LocalShipping, Receipt, PriceChange,
  Dashboard as DashboardIcon,
  ShoppingCart as ShoppingCartIcon,
  MonetizationOn as MoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  BarChart as ChartIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  MoreVert as MoreVertIcon,
  Refresh as RefreshIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
  AccountCircle as UserIcon,
  AttachMoney as AttachMoneyIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { logout } from '../services/authService';
import WarningIcon from '@mui/icons-material/Warning';
import { motion, AnimatePresence } from 'framer-motion';
import { styled } from '@mui/material/styles';

const API_URL = "https://suministros-backend.vercel.app"; // URL de tu backend en Vercel

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
      duration: 0.5
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24
    }
  }
};

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
  background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
  transition: 'all 0.3s ease',
  border: '1px solid rgba(0,0,0,0.05)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    borderColor: 'rgba(0,0,0,0.1)'
  }
}));

const ChartPlaceholder = styled(Box)(({ theme }) => ({
  height: '300px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
  backgroundColor: 'rgba(0,0,0,0.03)',
  borderRadius: '8px',
  padding: theme.spacing(2)
}));

const QuickLinkButton = styled(Button)(({ theme }) => ({
  borderRadius: '12px',
  padding: '12px 16px',
  textTransform: 'none',
  fontWeight: 'bold',
  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
  transition: 'all 0.2s ease',
  '&:hover': {
    boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
    transform: 'translateY(-3px)'
  }
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 'bold',
  borderRadius: '8px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  padding: '4px 0'
}));

const StatsBars = ({ data, color }) => {
  const max = Math.max(...data.values);
  
  return (
    <Box sx={{ width: '100%' }}>
      {data.labels.map((label, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2">{label}</Typography>
            <Typography variant="body2" fontWeight="bold">
              {data.prefix || ''}{data.values[index]}{data.suffix || ''}
            </Typography>
          </Box>
          <Box sx={{ width: '100%', bgcolor: 'background.paper', borderRadius: '4px', overflow: 'hidden' }}>
            <Box 
              sx={{ 
                height: '10px', 
                width: `${(data.values[index] / max) * 100}%`,
                bgcolor: color || 'primary.main',
                borderRadius: '4px'
              }} 
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatMesReferencia = (mesReferencia) => {
  if (!mesReferencia) return "N/A";
  // Si viene como "2025-01"
  if (/^\d{4}-\d{2}$/.test(mesReferencia)) {
    const [anio, mes] = mesReferencia.split("-");
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[parseInt(mes, 10) - 1]} ${anio}`;
  }
  // Si viene como fecha completa
  const fecha = new Date(mesReferencia);
  if (!isNaN(fecha)) {
    const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    return `${meses[fecha.getMonth()]} ${fecha.getFullYear()}`;
  }
  return mesReferencia;
};

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    ventas: 0,
    ventasMesActual: 0,
    ventasMesAnterior: 0,
    porcentajeCrecimiento: 0,
    productos: [],
    clientes: 0,
    mesReferencia: null,
    facturasPendientes: 0
  });
  const [productosNombres, setProductosNombres] = useState({});
  const [cargandoUltimasVentas, setCargandoUltimasVentas] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const lowStockProducts = useMemo(() => 
    dashboardData.productos.filter(p => p && p.stock < 5), 
    [dashboardData.productos]
  );

  const [stats, setStats] = useState({
    totalVentas: 0,
    ventasMensuales: 0,
    totalClientes: 0,
    productosStock: 0,
    facturasPendientes: 0,
    ultimasVentas: []
  });

  const [salesData, setSalesData] = useState({
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    values: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    prefix: '$'
  });

  const [productsData, setProductsData] = useState({
    labels: ['Clavos', 'Tornillos', 'Martillos', 'Pinturas', 'Cerrojos'],
    values: [0, 0, 0, 0, 0],
    suffix: ' uds.'
  });

  const fetchData = async () => {
    setCargando(true);
    try {
      const response = await fetch(`${API_URL}/api/dashboard`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result?.success || !result.data) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      setDashboardData({
        ventas: result.data.ventasTotales || 0,
        ventasMesActual: result.data.ventasMesActual || 0,
        ventasMesAnterior: result.data.ventasMesAnterior || 0,
        porcentajeCrecimiento: result.data.porcentajeCrecimiento || 0,
        productos: Array.isArray(result.data.productosBajoStock) 
          ? result.data.productosBajoStock 
          : [],
        clientes: result.data.totalClientes || 0,
        mesReferencia: result.data.mesReferencia || null,
        facturasPendientes: result.data.totalFacturasPendientes || 0
      });

      // Debug: Verificar estructura de productos con bajo stock
      if (result.data.productosBajoStock && Array.isArray(result.data.productosBajoStock)) {
        console.log('Productos con bajo stock recibidos:', result.data.productosBajoStock);
        console.log('Primer producto:', result.data.productosBajoStock[0]);
        
        // Si los productos no tienen nombre, obtenerlos por separado
        const productosSinNombre = result.data.productosBajoStock.filter(p => !p.nombre);
        if (productosSinNombre.length > 0) {
          console.log('Productos sin nombre encontrados, obteniendo nombres...');
          await obtenerNombresProductos(productosSinNombre);
        }
      }

      setStats({
        totalVentas: result.data.ventasTotales || 0,
        ventasMensuales: result.data.ventasMensuales || 0,
        totalClientes: result.data.totalClientes || 0,
        productosStock: result.data.productosStock || 0,
        facturasPendientes: result.data.facturasPendientes || 0,
        ultimasVentas: result.data.ultimasVentas || []
      });

      // Debug: Verificar últimas ventas
      if (result.data.ultimasVentas && Array.isArray(result.data.ultimasVentas)) {
        console.log('Últimas ventas recibidas del dashboard:', result.data.ultimasVentas);
        console.log('Cantidad de últimas ventas:', result.data.ultimasVentas.length);
        
        // Procesar las ventas para asegurar que los clientes tengan nombres
        const ventasProcesadas = result.data.ultimasVentas.map(venta => ({
          ...venta,
          cliente: venta.cliente?.nombre || venta.cliente || 'Cliente sin nombre',
          id: venta.id || venta._id
        }));
        
        setStats(prev => ({
          ...prev,
          ultimasVentas: ventasProcesadas
        }));
      } else {
        console.log('No se recibieron últimas ventas del dashboard, obteniendo desde endpoint de ventas...');
        await obtenerUltimasVentas();
      }

      setSalesData({
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        values: result.data.salesData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        prefix: '$'
      });

      setProductsData({
        labels: ['Clavos', 'Tornillos', 'Martillos', 'Pinturas', 'Cerrojos'],
        values: result.data.productsData || [0, 0, 0, 0, 0],
        suffix: ' uds.'
      });

    } catch (error) {
      console.error('Error en fetch:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      toast.error(`Error: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.fromLogin) {
      toast.success('¡Inicio de sesión exitoso!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
    }
  }, [location]);

  useEffect(() => {
    if (lowStockProducts.length > 0) {
      toast.warning(`${lowStockProducts.length} productos con bajo stock`, {
        position: "top-right",
        autoClose: 10000,
      });
    }
  }, [lowStockProducts.length]);

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada correctamente');
    navigate('/');
  };

  const obtenerNombresProductos = async (productos) => {
    try {
      const nombres = {};
      for (const producto of productos) {
        if (producto._id) {
          const response = await fetch(`${API_URL}/api/productos/${producto._id}`);
          if (response.ok) {
            const data = await response.json();
            nombres[producto._id] = data.nombre || 'Producto sin nombre';
          }
        }
      }
      setProductosNombres(prev => ({ ...prev, ...nombres }));
    } catch (error) {
      console.error('Error obteniendo nombres de productos:', error);
    }
  };

  const obtenerUltimasVentas = async () => {
    setCargandoUltimasVentas(true);
    try {
      const response = await fetch(`${API_URL}/api/ventas?limit=5`);
      if (response.ok) {
        const data = await response.json();
        if (data.ventas && Array.isArray(data.ventas)) {
          console.log('Últimas ventas obtenidas desde endpoint de ventas:', data.ventas);
          
          // Procesar las ventas para obtener nombres de clientes
          console.log('Iniciando procesamiento de ventas...');
          const ventasProcesadas = await Promise.all(
            data.ventas.map(async (venta, index) => {
              let nombreCliente = 'Cliente sin nombre';
              
              console.log(`\n--- Procesando venta ${index + 1} ---`);
              console.log('Datos de la venta:', {
                id: venta.id || venta._id,
                cliente: venta.cliente,
                tipoCliente: typeof venta.cliente,
                total: venta.total,
                fecha: venta.fecha
              });
              
              // Si el cliente es un objeto con nombre
              if (venta.cliente && typeof venta.cliente === 'object' && venta.cliente.nombre) {
                nombreCliente = venta.cliente.nombre;
                console.log('✅ Cliente encontrado como objeto:', nombreCliente);
              }
              // Si el cliente es un ID (string), intentar obtener el nombre
              else if (venta.cliente && typeof venta.cliente === 'string') {
                try {
                  console.log(`🔍 Obteniendo cliente por ID: ${venta.cliente}`);
                  const clienteResponse = await fetch(`${API_URL}/api/clientes/${venta.cliente}`);
                  console.log('Respuesta del cliente:', clienteResponse.status);
                  
                  if (clienteResponse.ok) {
                    const clienteData = await clienteResponse.json();
                    nombreCliente = clienteData.nombre || 'Cliente sin nombre';
                    console.log('✅ Cliente obtenido exitosamente:', nombreCliente);
                  } else {
                    console.log('❌ Error en respuesta del cliente:', clienteResponse.status);
                    nombreCliente = `Cliente ID: ${venta.cliente}`;
                  }
                } catch (error) {
                  console.error('❌ Error obteniendo datos del cliente:', error);
                  nombreCliente = `Cliente ID: ${venta.cliente}`;
                }
              } else {
                console.log('❌ Cliente no reconocido:', venta.cliente);
                nombreCliente = `Cliente desconocido: ${venta.cliente}`;
              }
              
              const ventaProcesada = {
                ...venta,
                cliente: nombreCliente,
                id: venta.id || venta._id
              };
              
              console.log('✅ Venta procesada:', {
                id: ventaProcesada.id,
                cliente: ventaProcesada.cliente,
                total: ventaProcesada.total
              });
              
              return ventaProcesada;
            })
          );
          
          console.log('\n🎉 Todas las ventas procesadas:', ventasProcesadas);
          
          setStats(prev => ({
            ...prev,
            ultimasVentas: ventasProcesadas
          }));
        }
      }
    } catch (error) {
      console.error('Error obteniendo últimas ventas:', error);
    } finally {
      setCargandoUltimasVentas(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const renderCard = (titulo, valor, esMoneda = false, colorAdicional) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {titulo}
        </Typography>
        <Typography 
          variant="h4" 
          style={colorAdicional ? { color: colorAdicional } : {}}
        >
          {esMoneda 
            ? `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
            : valor.toLocaleString()}
        </Typography>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h4" color="error">
          Error cargando el dashboard
        </Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>
          {error}
        </Typography>
        <Button 
          variant="contained" 
          sx={{ mt: 3 }}
          onClick={() => window.location.reload()}
        >
          Reintentar
        </Button>
      </Container>
    );
  }

  // Validación adicional para evitar errores de renderizado
  if (!dashboardData || !stats) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress size={80} />
      </Box>
    );
  }

  if (cargando) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress size={80} />
      </Box>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
            <img 
              src={logoRomero} 
              alt="DSR Distribuciones y Suministros Romero C.A." 
              style={{ 
                height: '80px', 
                width: 'auto',
                marginRight: '20px',
                maxWidth: '300px'
              }}
            />
          </Box>
          
          <TextField
            variant="outlined"
            placeholder="Buscar..."
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'warning.main' }} />
            }}
            sx={{ 
              mr: 2, 
              bgcolor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: 25,
              width: 300
            }}
          />
          
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            sx={{ color: 'warning.main' }}
          >
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[
            { 
              label: 'Procesar Venta', 
              to: '/ventas/procesar', 
              color: '#C62828',
              icon: <PointOfSale sx={{ fontSize: '2rem' }} />
            },
            {
              label: 'Inventario',
              to: '/inventario',
              color: '#1565C0',
              icon: <Inventory sx={{ fontSize: '2rem' }} />
            },
            {
              label: 'Gestión de Clientes',
              to: '/clientes/registrar',
              color: '#2E7D32',
              icon: <People sx={{ fontSize: '2rem' }} />
            },
            {
              label: 'Administración',
              to: '/administracion',
              color: '#6A4C93',
              icon: <Settings sx={{ fontSize: '2rem' }} />
            },
            {
              label: 'Facturas Pendientes',
              to: '/finanzas/facturas-pendientes',
              color: '#9E9E9E',
              icon: <Receipt sx={{ fontSize: '2rem' }} />
            },
            {
              label: 'Lista de Precios',
              to: '/precios',
              color: '#4CAF50',
              icon: <PriceChange sx={{ fontSize: '2rem' }} />
            }
          ].map((boton, index) => (
            <Grid item xs={12} md={3} key={index}>
              <Button
                component={Link}
                to={boton.to}
                variant="contained"
                sx={{ 
                  height: 110,
                  bgcolor: boton.color,
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  boxShadow: 3,
                  borderRadius: 2,
                  transition: 'all 0.2s ease',
                  '&:hover': { 
                    bgcolor: `${boton.color}CC`, 
                    transform: 'scale(1.02)' 
                  }
                }}
                fullWidth
                startIcon={boton.icon}
              >
                {boton.label}
              </Button>
            </Grid>
          ))}
        </Grid>



        {/* Dashboard Principal - Layout Compacto */}
        <Grid container spacing={3} sx={{ my: 3 }}>
          {/* Columna Izquierda - Estadísticas y Últimas Ventas */}
          <Grid item xs={12} lg={8}>
            <Grid container spacing={3}>
              {/* Tarjetas de Estadísticas - Layout Horizontal Compacto */}
              <Grid item xs={12}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <StatsCard sx={{ height: '120px' }}>
                        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Ventas Totales
                            </Typography>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                              {formatCurrency(dashboardData.ventas)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TrendingUpIcon sx={{ color: dashboardData.porcentajeCrecimiento >= 0 ? 'success.main' : 'error.main', fontSize: '0.9rem' }} />
                            <Typography variant="caption" color={dashboardData.porcentajeCrecimiento >= 0 ? "success.main" : "error.main"}>
                              {dashboardData.porcentajeCrecimiento >= 0 ? "+" : ""}
                              {dashboardData.porcentajeCrecimiento.toFixed(1)}%
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatsCard>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <StatsCard sx={{ height: '120px' }}>
                        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Total Clientes
                            </Typography>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                              {stats.totalClientes}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <TrendingUpIcon sx={{ color: 'success.main', fontSize: '0.9rem' }} />
                            <Typography variant="caption" color="success.main">
                              +5 nuevos
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatsCard>
                    </motion.div>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <motion.div variants={itemVariants}>
                      <StatsCard sx={{ height: '120px' }}>
                        <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                          <Box>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                              Facturas Pendientes
                            </Typography>
                            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
                              {dashboardData.facturasPendientes}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Receipt sx={{ color: 'warning.main', fontSize: '0.9rem' }} />
                            <Typography variant="caption" color="warning.main">
                              Con saldo pendiente
                            </Typography>
                          </Box>
                        </CardContent>
                      </StatsCard>
                    </motion.div>
                  </Grid>
                </Grid>
              </Grid>

              {/* Últimas Ventas - Layout Compacto */}
              <Grid item xs={12}>
                <motion.div variants={itemVariants}>
                  <Paper sx={{ 
                    p: 2, 
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    maxHeight: '400px',
                    overflow: 'hidden'
                  }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingCartIcon color="primary" sx={{ fontSize: '1.2rem' }} />
                      Últimas Ventas
                    </Typography>
                    
                    {cargandoUltimasVentas ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={30} />
                      </Box>
                    ) : stats.ultimasVentas.length === 0 ? (
                      <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                        No hay ventas recientes
                      </Typography>
                    ) : (
                      <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                        {stats.ultimasVentas.filter(venta => venta).slice(0, 4).map((venta, index) => (
                          <Box key={venta.id || venta._id || index}>
                            <Box sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              py: 1.5,
                              px: 1,
                              borderRadius: '8px',
                              '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' },
                              transition: 'background-color 0.2s ease'
                            }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                                  {venta.cliente?.nombre || venta.cliente || 'Cliente sin nombre'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(venta.fecha).toLocaleDateString('es-ES', { 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <StatusChip
                                  label={venta.estado === 'completada' ? 'Completada' : 'Pendiente'}
                                  color={venta.estado === 'completada' ? 'success' : 'warning'}
                                  size="small"
                                  status={venta.estado}
                                  sx={{ fontSize: '0.7rem', height: '20px' }}
                                />
                                <Typography variant="body2" sx={{ fontWeight: 'bold', minWidth: '60px', textAlign: 'right' }}>
                                  {formatCurrency(venta.total)}
                                </Typography>
                              </Box>
                            </Box>
                            {index < Math.min(stats.ultimasVentas.length - 1, 3) && (
                              <Divider sx={{ mx: 1 }} />
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                    
                    {stats.ultimasVentas.length > 4 && (
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Button 
                          variant="text" 
                          size="small"
                          onClick={() => navigate('/ventas/historial')}
                          sx={{ textTransform: 'none', fontSize: '0.8rem' }}
                        >
                          Ver todas las ventas ({stats.ultimasVentas.length})
                        </Button>
                      </Box>
                    )}
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </Grid>

          {/* Columna Derecha - Productos con Bajo Stock */}
          <Grid item xs={12} lg={4}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ 
                p: 2, 
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                height: 'fit-content',
                borderLeft: 4, 
                borderColor: 'warning.main',
                bgcolor: 'warning.light'
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: 2, 
                    fontWeight: 'bold', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    color: 'warning.dark'
                  }}
                >
                  <WarningIcon fontSize="inherit" />
                  Bajo Stock ({lowStockProducts.length})
                </Typography>
                
                <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
                  {lowStockProducts.map((producto, index) => {
                    if (!producto) return null;
                    return (
                      <Box key={producto._id || producto.id || `producto-${index}`}>
                        <Box sx={{ 
                          p: 1.5, 
                          mb: 1,
                          borderRadius: '8px',
                          bgcolor: 'background.paper',
                          border: 1,
                          borderColor: 'warning.light',
                          '&:hover': { 
                            bgcolor: 'rgba(255,255,255,0.8)',
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          },
                          transition: 'all 0.2s ease'
                        }}>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: 'warning.dark',
                              mb: 0.5,
                              fontSize: '0.85rem'
                            }}
                          >
                            {producto.nombre || producto.name || productosNombres[producto._id] || `Producto ID: ${producto._id?.slice(-6) || 'N/A'}`}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: 'error.main',
                              fontWeight: 'bold',
                              fontSize: '0.75rem'
                            }}
                          >
                            Stock: {producto.stock || 0}
                          </Typography>
                        </Box>
                        {index < lowStockProducts.length - 1 && (
                          <Divider sx={{ my: 0.5 }} />
                        )}
                      </Box>
                    );
                  })}
                </Box>
                
                {lowStockProducts.length === 0 && (
                  <Typography variant="body2" sx={{ textAlign: 'center', py: 2, color: 'text.secondary' }}>
                    No hay productos con bajo stock
                  </Typography>
                )}
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </motion.div>
  );
};

export default Dashboard;