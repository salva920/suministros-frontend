import React, { useState, useEffect } from 'react';
import {
  Container, Grid, Typography, Paper, Card, CardContent, CardHeader,
  IconButton, Button, Box, Divider, LinearProgress, CircularProgress,
  Tooltip, Avatar, useTheme, useMediaQuery, Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
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
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// API URL
const API_URL = "https://suministros-backend.vercel.app/api";

// Variantes de animación
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

// Componentes estilizados
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

// Componente para visualizar datos
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

// Función auxiliar para formatear moneda
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    minimumFractionDigits: 2
  }).format(amount);
};

const Dashboard = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      // En producción, descomentar esto:
      // const response = await axios.get(`${API_URL}/dashboard/stats`);
      // setStats(response.data);
      
      // Simulación de datos para desarrollo
      setTimeout(() => {
        setStats({
          totalVentas: 128500.75,
          ventasMensuales: 42680.50,
          totalClientes: 145,
          productosStock: 287,
          facturasPendientes: 8,
          ultimasVentas: [
            { 
              id: 1, 
              cliente: 'Juan Pérez', 
              fecha: '2023-09-15T14:30:00', 
              total: 1850.75, 
              productos: 5, 
              estado: 'completada' 
            },
            { 
              id: 2, 
              cliente: 'María Rodríguez', 
              fecha: '2023-09-14T10:15:00', 
              total: 3250.00, 
              productos: 8, 
              estado: 'completada' 
            },
            { 
              id: 3, 
              cliente: 'Carlos Sánchez', 
              fecha: '2023-09-13T16:45:00', 
              total: 920.50, 
              productos: 3, 
              estado: 'pendiente' 
            },
            { 
              id: 4, 
              cliente: 'Ana Martínez', 
              fecha: '2023-09-12T11:20:00', 
              total: 5150.25, 
              productos: 12, 
              estado: 'completada' 
            }
          ]
        });
        
        // Datos para gráficos
        setSalesData({
          ...salesData,
          values: [15200, 18500, 22300, 25600, 30100, 35200, 38500, 42600, 45100, 48200, 52100, 55800]
        });
        
        setProductsData({
          ...productsData,
          values: [145, 210, 85, 120, 175]
        });
        
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error al obtener datos del dashboard:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '60vh', 
            flexDirection: 'column',
            gap: 2
          }}>
            <CircularProgress size={60} thickness={4} />
            <Typography variant="h6" color="text.secondary">
              Cargando información...
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                Dashboard
              </Typography>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Tooltip title="Actualizar datos">
                  <IconButton onClick={fetchData} color="primary" sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)' }}>
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </motion.div>
            </Box>
            
            {/* SÓLO LA VERSIÓN MEJORADA DE LAS TARJETAS DE ESTADÍSTICAS */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <StatsCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Ventas Totales
                        </Typography>
                        <Avatar sx={{ bgcolor: 'rgba(25, 118, 210, 0.1)', color: 'primary.main' }}>
                          <MoneyIcon />
                        </Avatar>
                      </Box>
                      <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        {formatCurrency(stats.totalVentas)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          +8.5% desde el mes pasado
                        </Typography>
                      </Box>
                    </CardContent>
                  </StatsCard>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <StatsCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Ventas Mensuales
                        </Typography>
                        <Avatar sx={{ bgcolor: 'rgba(76, 175, 80, 0.1)', color: 'success.main' }}>
                          <AttachMoneyIcon />
                        </Avatar>
                      </Box>
                      <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        {formatCurrency(stats.ventasMensuales)}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          +12.3% desde el mes pasado
                        </Typography>
                      </Box>
                    </CardContent>
                  </StatsCard>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <StatsCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Clientes
                        </Typography>
                        <Avatar sx={{ bgcolor: 'rgba(156, 39, 176, 0.1)', color: 'secondary.main' }}>
                          <PeopleIcon />
                        </Avatar>
                      </Box>
                      <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        {stats.totalClientes}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon fontSize="small" color="success" />
                        <Typography variant="body2" color="success.main">
                          +5.2% desde el mes pasado
                        </Typography>
                      </Box>
                    </CardContent>
                  </StatsCard>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <motion.div variants={itemVariants}>
                  <StatsCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          Productos en Stock
                        </Typography>
                        <Avatar sx={{ bgcolor: 'rgba(244, 67, 54, 0.1)', color: 'error.main' }}>
                          <InventoryIcon />
                        </Avatar>
                      </Box>
                      <Typography variant="h5" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                        {stats.productosStock}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingDownIcon fontSize="small" color="error" />
                        <Typography variant="body2" color="error.main">
                          -2.1% desde el mes pasado
                        </Typography>
                      </Box>
                    </CardContent>
                  </StatsCard>
                </motion.div>
              </Grid>
            </Grid>
            
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <motion.div variants={itemVariants}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                  }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChartIcon color="primary" />
                      Ventas Mensuales
                    </Typography>
                    
                    <ChartPlaceholder>
                      <StatsBars data={salesData} color={theme.palette.primary.main} />
                    </ChartPlaceholder>
                  </Paper>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                  }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <InventoryIcon color="primary" />
                      Productos Populares
                    </Typography>
                    
                    <StatsBars data={productsData} color={theme.palette.secondary.main} />
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <motion.div variants={itemVariants}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                    mb: isMobile ? 3 : 0
                  }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingCartIcon color="primary" />
                      Últimas Ventas
                    </Typography>
                    
                    {stats.ultimasVentas.length === 0 ? (
                      <Typography variant="body1" sx={{ textAlign: 'center', py: 3, color: 'text.secondary' }}>
                        No hay ventas recientes para mostrar
                      </Typography>
                    ) : (
                      <Box sx={{ overflow: 'auto' }}>
                        <Grid container spacing={2}>
                          {stats.ultimasVentas.map((venta, index) => (
                            <Grid item xs={12} key={venta.id}>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                              >
                                <Card sx={{ 
                                  p: 2, 
                                  borderRadius: '12px', 
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                  '&:hover': {
                                    boxShadow: '0 6px 16px rgba(0,0,0,0.1)',
                                    bgcolor: 'rgba(0,0,0,0.01)'
                                  },
                                  transition: 'all 0.3s ease'
                                }}>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Box>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {venta.cliente}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        {new Date(venta.fecha).toLocaleDateString('es-ES', { 
                                          year: 'numeric', 
                                          month: 'short', 
                                          day: 'numeric' 
                                        })}
                                      </Typography>
                                    </Box>
                                    
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <StatusChip
                                        label={venta.estado === 'completada' ? 'Completada' : 'Pendiente'}
                                        color={venta.estado === 'completada' ? 'success' : 'warning'}
                                        size="small"
                                        status={venta.estado}
                                      />
                                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                        {formatCurrency(venta.total)}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Card>
                              </motion.div>
                              {index < stats.ultimasVentas.length - 1 && (
                                <Box sx={{ my: 1 }}>
                                  <Divider />
                                </Box>
                              )}
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    )}
                    
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button 
                          variant="outlined" 
                          onClick={() => navigate('/ventas/historial')}
                          endIcon={<ArrowUpIcon />}
                          sx={{ 
                            borderRadius: '10px',
                            textTransform: 'none'
                          }}
                        >
                          Ver todas las ventas
                        </Button>
                      </motion.div>
                    </Box>
                  </Paper>
                </motion.div>
              </Grid>
              
              {/* SÓLO LA VERSIÓN MEJORADA DE ACCESOS RÁPIDOS */}
              <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants}>
                  <Paper sx={{ 
                    p: 3, 
                    borderRadius: '16px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
                  }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DashboardIcon color="primary" />
                      Accesos Rápidos
                    </Typography>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <QuickLinkButton
                            fullWidth
                            variant="contained"
                            color="primary"
                            startIcon={<ShoppingCartIcon />}
                            onClick={() => navigate('/ventas')}
                            sx={{ 
                              mb: 2,
                              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                            }}
                          >
                            Nueva Venta
                          </QuickLinkButton>
                        </motion.div>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <QuickLinkButton
                            fullWidth
                            variant="outlined"
                            startIcon={<InventoryIcon />}
                            onClick={() => navigate('/inventario')}
                          >
                            Inventario
                          </QuickLinkButton>
                        </motion.div>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <QuickLinkButton
                            fullWidth
                            variant="outlined"
                            startIcon={<PeopleIcon />}
                            onClick={() => navigate('/clientes')}
                          >
                            Clientes
                          </QuickLinkButton>
                        </motion.div>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <QuickLinkButton
                            fullWidth
                            variant="outlined"
                            startIcon={<AttachMoneyIcon />}
                            onClick={() => navigate('/finanzas')}
                          >
                            Finanzas
                          </QuickLinkButton>
                        </motion.div>
                      </Grid>
                      
                      <Grid item xs={6}>
                        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                          <QuickLinkButton
                            fullWidth
                            variant="outlined"
                            startIcon={<AssignmentIcon />}
                            onClick={() => navigate('/reportes')}
                          >
                            Reportes
                          </QuickLinkButton>
                        </motion.div>
                      </Grid>
                    </Grid>
                  </Paper>
                </motion.div>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </motion.div>
  );
};

export default Dashboard;