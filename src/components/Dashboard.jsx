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
import axios from 'axios';
import { Chart, LinearScale, BarElement, CategoryScale, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Registrar los componentes necesarios para Chart.js
Chart.register(LinearScale, BarElement, CategoryScale, ChartTooltip, Legend);

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

const ChartContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
  height: '100%'
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
  
  const [salesChartData, setSalesChartData] = useState({
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Ventas Mensuales',
        data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(25, 118, 210, 0.6)',
        borderColor: 'rgba(25, 118, 210, 0.8)',
        borderWidth: 1
      }
    ]
  });
  
  const [productsChartData, setProductsChartData] = useState({
    labels: ['Productos A', 'Productos B', 'Productos C', 'Productos D', 'Productos E'],
    datasets: [
      {
        label: 'Productos más vendidos',
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)'
        ],
        borderWidth: 1
      }
    ]
  });
  
  const fetchData = async () => {
    setLoading(true);
    try {
      // Simulamos datos del dashboard - en producción se reemplazaría con llamadas reales
      // const response = await axios.get(`${API_URL}/dashboard/stats`);
      // setStats(response.data);
      
      // Datos de prueba
      setTimeout(() => {
        setStats({
          totalVentas: 128500.75,
          ventasMensuales: 42680.50,
          totalClientes: 145,
          productosStock: 287,
          facturasPendientes: 8,
          ultimasVentas: [
            { id: 1, cliente: 'Juan Pérez', total: 1250.50, fecha: '2023-10-01', estado: 'completada' },
            { id: 2, cliente: 'María García', total: 3450.25, fecha: '2023-10-02', estado: 'pendiente' },
            { id: 3, cliente: 'Carlos Rodríguez', total: 950.00, fecha: '2023-10-03', estado: 'completada' },
            { id: 4, cliente: 'Ana Martínez', total: 1875.30, fecha: '2023-10-04', estado: 'completada' }
          ]
        });
        
        setSalesChartData({
          labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
          datasets: [
            {
              label: 'Ventas Mensuales',
              data: [30500, 32400, 28600, 33700, 39800, 35200, 37400, 39200, 42600, 42680, 0, 0],
              backgroundColor: 'rgba(25, 118, 210, 0.6)',
              borderColor: 'rgba(25, 118, 210, 0.8)',
              borderWidth: 1
            }
          ]
        });
        
        setProductsChartData({
          labels: ['Clavos', 'Tornillos', 'Martillos', 'Pinturas', 'Cerrojos'],
          datasets: [
            {
              label: 'Productos más vendidos',
              data: [120, 95, 78, 65, 53],
              backgroundColor: [
                'rgba(255, 99, 132, 0.7)',
                'rgba(54, 162, 235, 0.7)',
                'rgba(255, 206, 86, 0.7)',
                'rgba(75, 192, 192, 0.7)',
                'rgba(153, 102, 255, 0.7)'
              ],
              borderWidth: 1
            }
          ]
        });
        
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al cargar los datos del dashboard:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-VE', {
      style: 'currency',
      currency: 'VES',
      minimumFractionDigits: 2
    }).format(value);
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };
  
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <motion.div variants={itemVariants}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 4,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0
          }}>
            <Typography variant="h4" component="h1" sx={{ 
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <DashboardIcon fontSize="large" color="primary" />
              Panel de Control
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2 }}>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="outlined" 
                  startIcon={<RefreshIcon />}
                  onClick={fetchData}
                  sx={{ 
                    borderRadius: '10px',
                    textTransform: 'none'
                  }}
                >
                  Actualizar
                </Button>
              </motion.div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  variant="contained"
                  startIcon={<ShoppingCartIcon />}
                  onClick={() => navigate('/ventas')}
                  sx={{ 
                    borderRadius: '10px',
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    boxShadow: '0 3px 5px 2px rgba(33, 150, 243, .3)',
                    textTransform: 'none',
                    fontWeight: 'bold'
                  }}
                >
                  Nueva Venta
                </Button>
              </motion.div>
            </Box>
          </Box>
        </motion.div>
        
        {loading ? (
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress 
              color="secondary" 
              sx={{
                height: 6,
                borderRadius: 3,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                }
              }}
            />
          </Box>
        ) : (
          <>
            {/* Tarjetas de estadísticas */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <motion.div variants={itemVariants}>
                  <StatsCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Ventas Totales
                        </Typography>
                        <Avatar sx={{ 
                          bgcolor: 'primary.light', 
                          width: 48, 
                          height: 48,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}>
                          <MoneyIcon />
                        </Avatar>
                      </Box>
                      
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {formatCurrency(stats.totalVentas)}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',  
                        color: 'success.main',
                        gap: 0.5
                      }}>
                        <ArrowUpIcon fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          +8.5% respecto al mes anterior
                        </Typography>
                      </Box>
                    </CardContent>
                  </StatsCard>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <motion.div variants={itemVariants}>
                  <StatsCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Clientes
                        </Typography>
                        <Avatar sx={{ 
                          bgcolor: 'success.light', 
                          width: 48, 
                          height: 48,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}>
                          <PeopleIcon />
                        </Avatar>
                      </Box>
                      
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {stats.totalClientes}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',  
                        color: 'success.main',
                        gap: 0.5
                      }}>
                        <ArrowUpIcon fontSize="small" />
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          +12 nuevos este mes
                        </Typography>
                      </Box>
                    </CardContent>
                  </StatsCard>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <motion.div variants={itemVariants}>
                  <StatsCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Inventario
                        </Typography>
                        <Avatar sx={{ 
                          bgcolor: 'info.light', 
                          width: 48, 
                          height: 48,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}>
                          <InventoryIcon />
                        </Avatar>
                      </Box>
                      
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {stats.productosStock}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',  
                        color: stats.productosStock < 300 ? 'warning.main' : 'success.main',
                        gap: 0.5
                      }}>
                        {stats.productosStock < 300 ? (
                          <>
                            <ArrowDownIcon fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              5 productos con stock bajo
                            </Typography>
                          </>
                        ) : (
                          <>
                            <TrendingUpIcon fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              Niveles de stock óptimos
                            </Typography>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </StatsCard>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} sm={6} md={6} lg={3}>
                <motion.div variants={itemVariants}>
                  <StatsCard>
                    <CardContent sx={{ p: 3 }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                          Facturas Pendientes
                        </Typography>
                        <Avatar sx={{ 
                          bgcolor: 'warning.light', 
                          width: 48, 
                          height: 48,
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }}>
                          <AssignmentIcon />
                        </Avatar>
                      </Box>
                      
                      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {stats.facturasPendientes}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center',  
                        color: stats.facturasPendientes > 5 ? 'warning.main' : 'success.main',
                        gap: 0.5
                      }}>
                        {stats.facturasPendientes > 5 ? (
                          <>
                            <TrendingUpIcon fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              3 facturas por vencer pronto
                            </Typography>
                          </>
                        ) : (
                          <>
                            <TrendingDownIcon fontSize="small" />
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              Disminución de 10% este mes
                            </Typography>
                          </>
                        )}
                      </Box>
                    </CardContent>
                  </StatsCard>
                </motion.div>
              </Grid>
            </Grid>
            
            {/* Gráficos */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={8}>
                <motion.div variants={itemVariants}>
                  <ChartContainer>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ChartIcon color="primary" />
                      Ventas Mensuales
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar data={salesChartData} options={chartOptions} />
                    </Box>
                  </ChartContainer>
                </motion.div>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <motion.div variants={itemVariants}>
                  <ChartContainer>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StarIcon color="primary" />
                      Productos Más Vendidos
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar 
                        data={productsChartData} 
                        options={{
                          ...chartOptions,
                          indexAxis: 'y',
                        }} 
                      />
                    </Box>
                  </ChartContainer>
                </motion.div>
              </Grid>
            </Grid>
            
            {/* Últimas ventas y accesos rápidos */}
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