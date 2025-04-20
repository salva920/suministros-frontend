import React, { useState, useEffect, useMemo } from 'react';
import { 
  AppBar, Toolbar, Typography, Container, Grid, 
  Paper, TextField, IconButton, Button, Card, 
  CardContent, CircularProgress, Box 
} from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ExitToApp, Search, PointOfSale, 
  Inventory, Settings, People 
} from '@mui/icons-material';
import { logout } from '../services/authService';
import WarningIcon from '@mui/icons-material/Warning';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    ventas: 0,
    productos: [],
    clientes: 0
  });
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  const lowStockProducts = useMemo(() => 
    dashboardData.productos.filter(p => p.stock < 5), 
    [dashboardData.productos]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCargando(true);
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
          productos: Array.isArray(result.data.productosBajoStock) 
            ? result.data.productosBajoStock 
            : [],
          clientes: result.data.totalClientes || 0
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
    <>
      <AppBar position="static" sx={{ bgcolor: 'primary.dark' }}>
        <Toolbar>
          <Typography 
            variant="h6" 
            sx={{ 
              flexGrow: 1, 
              fontWeight: 'bold',
              color: 'common.white',
              textTransform: 'uppercase',
              letterSpacing: 1
            }}
          >
            Distribuciones y suministros Romero C.A.
          </Typography>
          
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
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            {renderCard('Ventas Totales', dashboardData.ventas, true, '#FFD700')}
          </Grid>
          
          <Grid item xs={12} sm={4}>
            {renderCard(
              'Productos con Bajo Stock', 
              lowStockProducts.length,
              false,
              lowStockProducts.length > 0 ? 'error.main' : null
            )}
          </Grid>
          
          <Grid item xs={12} sm={4}>
            {renderCard('Clientes Registrados', dashboardData.clientes)}
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ my: 4 }}>
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

        {lowStockProducts.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper elevation={3} sx={{ 
                p: 3, 
                borderLeft: 4, 
                borderColor: 'warning.main',
                bgcolor: 'warning.light'
              }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    color: 'error.main',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <WarningIcon fontSize="inherit" />
                  Productos con Bajo Stock ({lowStockProducts.length})
                </Typography>
                
                <Grid container spacing={2}>
                  {lowStockProducts.map((producto) => (
                    <Grid item xs={12} sm={6} md={4} key={producto._id}>
                      <Paper sx={{ 
                        p: 2, 
                        border: 1, 
                        borderColor: 'warning.light',
                        borderRadius: 2,
                        bgcolor: 'background.paper'
                      }}>
                        <Typography 
                          variant="subtitle1" 
                          sx={{ fontWeight: 'bold', color: 'warning.dark' }}
                        >
                          {producto.nombre}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'error.main' }}>
                          Stock: {producto.stock}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        )}
      </Container>
    </>
  );
};

export default Dashboard;