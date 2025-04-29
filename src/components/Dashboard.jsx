import React, { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Container, Grid, 
  Paper, IconButton, Button, Card, CardContent, 
  Box, Divider, useMediaQuery, Drawer, List, 
  ListItem, ListItemIcon, ListItemText, Hidden
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ExitToApp, PointOfSale, Inventory, People,
  Settings, Receipt, Dashboard as DashboardIcon,
  Menu, ShoppingCart, Assignment, AttachMoney
} from '@mui/icons-material';
import { logout } from '../services/authService';
import { motion } from 'framer-motion';

const API_URL = "https://suministros-backend.vercel.app";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    ultimasVentas: [],
    totalVentas: 0,
    productosStock: 0
  });
  
  const [cargando, setCargando] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width:600px)');

  const menuItems = [
    { text: 'Nueva Venta', icon: <PointOfSale />, path: '/ventas' },
    { text: 'Inventario', icon: <Inventory />, path: '/inventario' },
    { text: 'Clientes', icon: <People />, path: '/clientes' },
    { text: 'Facturas', icon: <Assignment />, path: '/facturas' },
    { text: 'Finanzas', icon: <AttachMoney />, path: '/finanzas' },
    { text: 'Configuración', icon: <Settings />, path: '/configuracion' }
  ];

  const fetchData = async () => {
    try {
      const response = await fetch(`${API_URL}/api/dashboard`);
      const result = await response.json();
      
      setDashboardData({
        ultimasVentas: result.data.ultimasVentas || [],
        totalVentas: result.data.ventasTotales || 0,
        productosStock: result.data.productosStock || 0
      });
      
    } catch (error) {
      toast.error('Error cargando datos del dashboard');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    toast.info('Sesión cerrada correctamente');
  };

  const drawerContent = (
    <div>
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            component={Link} 
            to={item.path}
            sx={{ 
              borderRadius: 2,
              margin: 1,
              '&:hover': { backgroundColor: 'rgba(25, 118, 210, 0.1)' }
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  if (cargando) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex' }}>
      {/* Barra de navegación superior */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Hidden mdUp>
            <IconButton
              color="inherit"
              edge="start"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ mr: 2 }}
            >
              <Menu />
            </IconButton>
          </Hidden>
          
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Panel de Control
          </Typography>
          
          <IconButton color="inherit" onClick={handleLogout}>
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Menú lateral */}
      <Hidden mdDown>
        <Drawer
          variant="permanent"
          sx={{
            width: 240,
            flexShrink: 0,
            '& .MuiDrawer-paper': { 
              width: 240,
              boxSizing: 'border-box',
              borderRight: 'none',
              backgroundColor: 'background.paper'
            },
          }}
        >
          <Toolbar /> {/* Espacio para la AppBar */}
          {drawerContent}
        </Drawer>
      </Hidden>

      <Hidden mdUp>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': { 
              width: 240,
              backgroundColor: 'background.paper'
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Hidden>

      {/* Contenido principal */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar /> {/* Espacio para la AppBar */}
        
        <Grid container spacing={3}>
          {/* Tarjetas de resumen */}
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ventas Totales
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  ${dashboardData.totalVentas.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6} lg={4}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Productos en Stock
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                  {dashboardData.productosStock}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Últimas Ventas */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 'bold' }}>
                  Últimas Ventas
                </Typography>
                
                {dashboardData.ultimasVentas.map((venta, index) => (
                  <motion.div
                    key={venta.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Box sx={{ 
                      p: 2,
                      mb: 1,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'background.default',
                      borderRadius: 2
                    }}>
                      <div>
                        <Typography fontWeight="bold">{venta.cliente}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          {new Date(venta.fecha).toLocaleDateString()}
                        </Typography>
                      </div>
                      <Typography fontWeight="bold">
                        ${venta.total.toLocaleString()}
                      </Typography>
                    </Box>
                    {index < dashboardData.ultimasVentas.length - 1 && <Divider />}
                  </motion.div>
                ))}

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Button 
                    variant="outlined"
                    onClick={() => navigate('/ventas/historial')}
                    sx={{ borderRadius: 3 }}
                  >
                    Ver historial completo
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default Dashboard;