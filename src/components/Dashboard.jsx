import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppBar, Toolbar, Typography, Container, Grid, 
  Paper, TextField, IconButton, Button, Card, 
  CardContent, CircularProgress, Box, Divider, LinearProgress,
  Tooltip, Avatar, useTheme, useMediaQuery, Chip
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ExitToApp, Search, 
  Inventory, Settings, People, Receipt, PriceChange,
  ShoppingCart as ShoppingCartIcon,
  MonetizationOn as MoneyIcon,
  People as PeopleIcon,
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as AttachMoneyIcon
} from '@mui/icons-material';
import { logout } from '../services/authService';
import WarningIcon from '@mui/icons-material/Warning';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';

const API_URL = "https://suministros-backend.vercel.app";

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
  borderRadius: '16px',
  overflow: 'hidden',
  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
  background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 28px rgba(0,0,0,0.15)'
  }
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
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2
  }).format(amount);
};

const Dashboard = () => {
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [stats, setStats] = useState({
    totalVentas: 0,
    ventasMensuales: 0,
    totalClientes: 0,
    productosStock: 0,
    productosBajoStock: 0,
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
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const result = await response.json();
      if (!result?.success || !result.data) throw new Error('Respuesta inválida del servidor');

      setStats({
        totalVentas: result.data.ventasTotales || 0,
        ventasMensuales: result.data.ventasMensuales || 0,
        totalClientes: result.data.totalClientes || 0,
        productosStock: result.data.productosStock || 0,
        productosBajoStock: result.data.productosBajoStock?.length || 0,
        ultimasVentas: result.data.ultimasVentas || []
      });

      setSalesData({
        labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
        values: result.data.salesData || [],
        prefix: '$'
      });

      setProductsData({
        labels: ['Clavos', 'Tornillos', 'Martillos', 'Pinturas', 'Cerrojos'],
        values: result.data.productsData || [],
        suffix: ' uds.'
      });

    } catch (error) {
      console.error('Error:', error);
      toast.error(`Error: ${error.message}`);
      setError(error.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (location.state?.fromLogin) {
      toast.success('¡Inicio de sesión exitoso!');
    }
  }, [location]);

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada correctamente');
    navigate('/');
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ textAlign: 'center', mt: 10 }}>
        <Typography variant="h4" color="error">Error cargando el dashboard</Typography>
        <Typography variant="body1" sx={{ mt: 2 }}>{error}</Typography>
        <Button variant="contained" sx={{ mt: 3 }} onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </Container>
    );
  }

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress size={80} />
      </Box>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: 'common.white', textTransform: 'uppercase' }}>
            Distribuciones y suministros Romero C.A.
          </Typography>
          
          <TextField
            variant="outlined"
            placeholder="Buscar..."
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ mr: 1, color: 'warning.main' }} />}}
            sx={{ mr: 2, bgcolor: 'rgba(255, 255, 255, 0.9)', borderRadius: 25, width: 300 }}
          />
          
          <IconButton color="inherit" onClick={handleLogout} sx={{ color: 'warning.main' }}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        {/* Sección de Estadísticas Principales */}
        <Grid container spacing={3} sx={{ my: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <StatsCard>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ventas Totales
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {formatCurrency(stats.totalVentas)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    <Typography variant="body2" color="success.main">
                      +12.5% mes anterior
                    </Typography>
                  </Box>
                </CardContent>
              </StatsCard>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <StatsCard>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Ventas del Mes
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {formatCurrency(stats.ventasMensuales)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    <Typography variant="body2" color="success.main">
                      +8.2% mes anterior
                    </Typography>
                  </Box>
                </CardContent>
              </StatsCard>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <StatsCard>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Total de Clientes
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.totalClientes}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                    <Typography variant="body2" color="success.main">
                      +5 nuevos este mes
                    </Typography>
                  </Box>
                </CardContent>
              </StatsCard>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <motion.div variants={itemVariants}>
              <StatsCard>
                <CardContent>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Productos en Stock
                  </Typography>
                  <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', mb: 1 }}>
                    {stats.productosStock}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <TrendingDownIcon sx={{ color: 'warning.main', fontSize: '1rem' }} />
                    <Typography variant="body2" color="warning.main">
                      {stats.productosBajoStock} bajo stock
                    </Typography>
                  </Box>
                </CardContent>
              </StatsCard>
            </motion.div>
          </Grid>
        </Grid>

        {/* Gráficos y Sección Principal */}
        <Grid container spacing={3} sx={{ my: 4 }}>
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MoneyIcon color="primary" />
                  Ventas Mensuales
                </Typography>
                <StatsBars data={salesData} color="rgba(25, 118, 210, 0.7)" />
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <InventoryIcon color="primary" />
                  Productos Más Vendidos
                </Typography>
                <StatsBars data={productsData} color="rgba(156, 39, 176, 0.7)" />
              </Paper>
            </motion.div>
          </Grid>
        </Grid>

        {/* Últimas Ventas y Accesos Rápidos */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)', mb: isMobile ? 3 : 0 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCartIcon color="primary" />
                  Últimas Ventas
                </Typography>
                
                {stats.ultimasVentas.length === 0 ? (
                  <Typography variant="body1" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                    No hay ventas recientes
                  </Typography>
                ) : (
                  <Box sx={{ overflow: 'auto' }}>
                    <Grid container spacing={2}>
                      {stats.ultimasVentas.map((venta, index) => (
                        <Grid item xs={12} key={venta.id}>
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                            <Card sx={{ p: 2, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', '&:hover': { boxShadow: '0 6px 16px rgba(0,0,0,0.1)' }}}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{venta.cliente}</Typography>
                                  <Typography variant="body2" color="text.secondary">
                                    {new Date(venta.fecha).toLocaleDateString('es-ES')}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <StatusChip
                                    label={venta.estado === 'completada' ? 'Completada' : 'Pendiente'}
                                    color={venta.estado === 'completada' ? 'success' : 'warning'}
                                    size="small"
                                  />
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {formatCurrency(venta.total)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Card>
                          </motion.div>
                          {index < stats.ultimasVentas.length - 1 && <Divider sx={{ my: 1 }} />}
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Paper>
            </motion.div>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <motion.div variants={itemVariants}>
              <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Accesos Rápidos
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <QuickLinkButton
                      fullWidth
                      variant="contained"
                      color="primary"
                      startIcon={<ShoppingCartIcon />}
                      onClick={() => navigate('/ventas')}
                      sx={{ mb: 2, background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)' }}
                    >
                      Nueva Venta
                    </QuickLinkButton>
                  </Grid>
                  
                  {[
                    { label: 'Inventario', icon: <InventoryIcon />, path: '/inventario' },
                    { label: 'Clientes', icon: <PeopleIcon />, path: '/clientes' },
                    { label: 'Finanzas', icon: <AttachMoneyIcon />, path: '/finanzas' },
                    { label: 'Reportes', icon: <AssignmentIcon />, path: '/reportes' }
                  ].map((boton, index) => (
                    <Grid item xs={6} key={index}>
                      <QuickLinkButton
                        fullWidth
                        variant="outlined"
                        startIcon={boton.icon}
                        onClick={() => navigate(boton.path)}
                      >
                        {boton.label}
                      </QuickLinkButton>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </motion.div>
          </Grid>
        </Grid>
      </Container>
    </motion.div>
  );
};

export default Dashboard;