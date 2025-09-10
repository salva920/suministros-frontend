import React, { useState } from 'react';
import { Container, Tabs, Tab, Box, Typography, Button, Paper, TextField, Backdrop, Dialog, DialogTitle, DialogContent, DialogActions, DialogContentText, CircularProgress } from '@mui/material';
import { Dashboard, VpnKey } from '@mui/icons-material';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import ControlFinanciero from './ControlFinanciero';
import ReportesFinancieros from './ReportesFinancieros';
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = "https://suministros-backend.vercel.app/api";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Administracion = () => {
  const [tabValue, setTabValue] = useState(0);
  const [clave, setClave] = useState('');
  const [autenticado, setAutenticado] = useState(false);
  const [openChangeKey, setOpenChangeKey] = useState(false);
  const [currentKey, setCurrentKey] = useState('');
  const [newKey, setNewKey] = useState('');
  const [loadingKey, setLoadingKey] = useState(false);
  const navigate = useNavigate();

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmitClave = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.get(`${API_URL}/unlock-key`);
      const claveActual = response.data.key;

      if (clave === claveActual) {
        setAutenticado(true);
        toast.success('Acceso autorizado');
      } else {
        toast.error('Clave incorrecta');
        setClave('');
      }
    } catch (error) {
      console.error('Error al verificar la clave:', error);
      toast.error('Error al verificar la clave');
      setClave('');
    }
  };

  const handleChangeUnlockKey = async (e) => {
    e.preventDefault();
    
    // Validaciones
    if (!currentKey.trim()) {
      toast.error('Debe ingresar la clave actual');
      return;
    }
    
    if (!newKey.trim()) {
      toast.error('Debe ingresar la nueva clave');
      return;
    }
    
    if (newKey.length < 4) {
      toast.error('La nueva clave debe tener al menos 4 caracteres');
      return;
    }
    
    if (currentKey === newKey) {
      toast.error('La nueva clave debe ser diferente a la actual');
      return;
    }
    
    setLoadingKey(true);
    try {
      const res = await axios.post(`${API_URL}/unlock-key/change`, {
        currentKey: currentKey.trim(),
        newKey: newKey.trim()
      });
      
      if (res.data.success) {
        toast.success('Clave cambiada correctamente');
        setOpenChangeKey(false);
        setCurrentKey('');
        setNewKey('');
      } else {
        toast.error(res.data.message || 'Error al cambiar la clave');
      }
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error('Clave actual incorrecta');
      } else if (err.response?.status === 400) {
        toast.error(err.response.data.message || 'Datos inválidos');
      } else {
        toast.error('Error al cambiar la clave. Intente nuevamente.');
      }
      console.error('Error cambiando clave:', err);
    } finally {
      setLoadingKey(false);
    }
  };

  // Limpiar campos cuando se cierre el modal de cambio de clave
  React.useEffect(() => {
    if (!openChangeKey) {
      setCurrentKey('');
      setNewKey('');
    }
  }, [openChangeKey]);

  if (!autenticado) {
    return (
      <>
        <Backdrop open sx={{ backdropFilter: 'blur(8px)', zIndex: (theme) => theme.zIndex.modal - 1 }}>
          <Paper sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
            <Typography variant="h5" gutterBottom>Acceso Restringido</Typography>
            <TextField
              label="Clave de acceso"
              type="password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              sx={{ mb: 2 }}
              fullWidth
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSubmitClave}
                fullWidth
              >
                Ingresar
              </Button>
              <Button
                variant="text"
                color="secondary"
                onClick={() => setOpenChangeKey(true)}
                startIcon={<VpnKey />}
                sx={{ textTransform: 'none' }}
              >
                Cambiar Contraseña
              </Button>
            </Box>
          </Paper>
        </Backdrop>

        {/* Modal para cambiar contraseña */}
        <Dialog open={openChangeKey} onClose={() => setOpenChangeKey(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ 
            bgcolor: 'primary.main', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <VpnKey /> Cambiar Clave de Acceso
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <form onSubmit={handleChangeUnlockKey}>
              <TextField
                label="Clave actual"
                type="password"
                fullWidth
                margin="normal"
                value={currentKey}
                onChange={e => setCurrentKey(e.target.value)}
                required
                variant="outlined"
                placeholder="Ingrese la clave actual"
                sx={{ mb: 2 }}
              />
              <TextField
                label="Nueva clave"
                type="password"
                fullWidth
                margin="normal"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                required
                variant="outlined"
                placeholder="Ingrese la nueva clave"
                sx={{ mb: 3 }}
              />
              <DialogActions sx={{ justifyContent: 'flex-end', gap: 1 }}>
                <Button 
                  onClick={() => {
                    setOpenChangeKey(false);
                    setCurrentKey('');
                    setNewKey('');
                  }} 
                  variant="outlined"
                  color="secondary"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  color="primary" 
                  variant="contained"
                  disabled={loadingKey || !currentKey || !newKey}
                  startIcon={loadingKey ? <CircularProgress size={20} /> : <VpnKey />}
                >
                  {loadingKey ? 'Cambiando...' : 'Cambiar Clave'}
                </Button>
              </DialogActions>
            </form>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Botón para ir al dashboard */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/dashboard')}
        sx={{ mb: 2 }}
        startIcon={<Dashboard />}
      >
        Ir al Dashboard
      </Button>

      {/* Título y pestañas */}
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'primary.main',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          Administración
        </Typography>

        <Tabs 
          value={tabValue} 
          onChange={handleChangeTab} 
          aria-label="Pestañas de Administración"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            },
          }}
        >
          <Tab label="Control Financiero" sx={{ fontWeight: 'bold' }} />
          <Tab label="Reportes Financieros" sx={{ fontWeight: 'bold' }} />
          <Tab label="Gestión de Caja" sx={{ fontWeight: 'bold' }} component={Link} to="/administracion/caja" />
        </Tabs>
      </Paper>

      {/* Contenido de las Pestañas */}
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
        <TabPanel value={tabValue} index={0}>
          <ControlFinanciero />
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <ReportesFinancieros />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <Outlet />
        </TabPanel>
      </Paper>
    </Container>
  );
};

export default Administracion; 