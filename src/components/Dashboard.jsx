import React, { useState, useEffect, useMemo } from 'react';
import { AppBar, Toolbar, Typography, Container, Grid, Paper, TextField, IconButton, Button, Card, CardContent } from '@mui/material';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ExitToApp, Search, PointOfSale, Inventory, Settings, People } from '@mui/icons-material';
import { logout } from '../services/authService';
import WarningIcon from '@mui/icons-material/Warning';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

const Dashboard = () => {
  const [ventas, setVentas] = useState(0);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const [cargando, setCargando] = useState(true);

  const lowStockProducts = useMemo(() => 
    productos.filter(p => p.stock < 5), 
    [productos]
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setCargando(true);
        const response = await fetch(`${API_URL}/api/dashboard`);
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        if (!result || 
            typeof result.ventasTotales !== 'number' ||
            !Array.isArray(result.productosBajoStock) ||
            typeof result.totalClientes !== 'number') {
          throw new Error('Estructura de datos inválida');
        }
        
        setVentas(Number(result.ventasTotales.toFixed(2)));
        setProductos(result.productosBajoStock);
        setClientes(result.totalClientes);

      } catch (error) {
        console.error('Error en carga de datos:', {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        toast.error(`Error crítico: ${error.message}`);
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
        progress: undefined,
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

  const totalVentas = ventas;
  const totalProductosBajoStock = productos.length;
  const totalClientesRegistrados = clientes;

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada correctamente');
    navigate('/');
  };

  return (
    <>
      <AppBar position="static" style={{ background: '#1A365D' }}>
        <Toolbar>
          <Typography variant="h6" style={{ 
            flexGrow: 1, 
            fontWeight: 'bold',
            color: '#FFFFFF',
            textTransform: 'uppercase',
            fontSize: '1.25rem',
            letterSpacing: '1px'
          }}>
            Distribuciones y suministros Romero C.A. 
          </Typography>
          <TextField
            variant="outlined"
            placeholder="Buscar..."
            size="small"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            InputProps={{
              startAdornment: <Search style={{ marginRight: '0.5rem', color: '#FFD700' }} />
            }}
            style={{ 
              marginRight: '1rem', 
              backgroundColor: 'rgba(255, 255, 255, 0.9)', 
              borderRadius: '25px',
              width: '300px'
            }}
          />
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            style={{ color: '#FFD700' }}
          >
            <ExitToApp />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container 
        maxWidth="xl" 
        sx={{ 
          marginTop: '2rem',
          paddingLeft: { xs: 2, sm: 3, md: 4 },
          paddingRight: { xs: 2, sm: 3, md: 4 },
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Ventas Totales
                </Typography>
                <Typography variant="h4" style={{ color: '#FFD700' }}>
                  ${totalVentas.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Productos con Bajo Stock
                </Typography>
                <Typography variant="h4" color={lowStockProducts.length > 0 ? 'error' : 'inherit'}>
                  {lowStockProducts.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Clientes Registrados
                </Typography>
                <Typography variant="h4">
                  {totalClientesRegistrados.toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Grid container spacing={3} style={{ marginBottom: '2rem' }}>
          <Grid item xs={12} md={3}>
            <Button
              component={Link}
              to="/ventas/procesar"
              variant="contained"
              style={{ 
                height: '110px',
                backgroundColor: '#C62828',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxShadow: '0px 3px 5px rgba(0,0,0,0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#B71C1C',
                  transform: 'scale(1.02)'
                }
              }}
              fullWidth
              startIcon={<PointOfSale style={{ fontSize: '2rem' }} />}
            >
              Procesar Venta
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              component={Link}
              to="/inventario"
              variant="contained"
              style={{ 
                height: '110px',
                backgroundColor: '#1565C0',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxShadow: '0px 3px 5px rgba(0,0,0,0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#0D47A1',
                  transform: 'scale(1.02)'
                }
              }}
              fullWidth
              startIcon={<Inventory style={{ fontSize: '2rem' }} />}
            >
              Inventario
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              component={Link}
              to="/clientes/registrar"
              variant="contained"
              style={{ 
                height: '110px',
                backgroundColor: '#2E7D32',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxShadow: '0px 3px 5px rgba(0,0,0,0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#1B5E20',
                  transform: 'scale(1.02)'
                }
              }}
              fullWidth
              startIcon={<People style={{ fontSize: '2rem' }} />}
            >
              Gestión de Clientes
            </Button>
          </Grid>
          <Grid item xs={12} md={3}>
            <Button
              component={Link}
              to="/administracion"
              variant="contained"
              style={{ 
                height: '110px',
                backgroundColor: '#6A4C93',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                boxShadow: '0px 3px 5px rgba(0,0,0,0.2)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: '#4A2C6F',
                  transform: 'scale(1.02)'
                }
              }}
              fullWidth
              startIcon={<Settings style={{ fontSize: '2rem' }} />}
            >
              Administración
            </Button>
          </Grid>
        </Grid>

        {lowStockProducts.length > 0 && (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper elevation={3} style={{ 
                padding: '1.5rem', 
                borderLeft: '6px solid #FF6B35',
                backgroundColor: '#FFF3E0'
              }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  style={{ 
                    color: '#C62828', 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <WarningIcon fontSize="inherit" />
                  Productos con Bajo Stock ({lowStockProducts.length})
                </Typography>
                
                <Grid container spacing={2}>
                  {lowStockProducts.map((producto) => (
                    <Grid item xs={12} sm={6} md={4} key={producto._id}>
                      <Paper style={{ 
                        padding: '1rem',
                        border: '1px solid #FFCC80',
                        borderRadius: '8px',
                        background: '#FFF8E1'
                      }}>
                        <Typography variant="subtitle1" style={{ fontWeight: 'bold', color: '#E65100' }}>
                          {producto.nombre}
                        </Typography>
                        <Typography variant="body2" style={{ color: '#D84315' }}>
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