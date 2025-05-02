import React, { useState } from 'react';
import { Container, Tabs, Tab, Box, Typography, Button, Paper } from '@mui/material';
import { Dashboard } from '@mui/icons-material';
import { useNavigate, Link, Outlet } from 'react-router-dom';
import ControlFinanciero from './ControlFinanciero';
import ReportesFinancieros from './ReportesFinancieros';

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
  const navigate = useNavigate();

  const handleChangeTab = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleSubmitClave = (e) => {
    e.preventDefault();
    if (clave === 'abril') {
      setAutenticado(true);
    } else {
      alert('Clave incorrecta');
      setClave('');
    }
  };

  if (!autenticado) {
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: '#f8f9fa' }}>
          <Typography variant="h5" gutterBottom>
            Ingrese la clave para acceder
          </Typography>
          <form onSubmit={handleSubmitClave}>
            <input
              type="password"
              value={clave}
              onChange={e => setClave(e.target.value)}
              placeholder="Clave"
              style={{ padding: 8, width: '100%', marginBottom: 16 }}
            />
            <Button type="submit" variant="contained" color="primary" fullWidth>
              Acceder
            </Button>
          </form>
        </Paper>
      </Container>
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