// src/components/ventas/components/ClienteSearch.jsx
import { TextField, Button, Grid, FormControl, InputLabel, Select, MenuItem, Box, Chip } from '@mui/material';
import { PersonSearch, AssignmentInd, PersonAdd } from '@mui/icons-material';

export const ClienteSearch = ({ 
  busquedaDni, 
  setBusquedaDni, 
  clientes, 
  cliente, 
  setCliente,
  setMostrarRegistro 
}) => {
  const handleBuscarCliente = () => {
    // Lógica de búsqueda...
  };

  return (
    <Paper elevation={1} sx={{ p: 2, backgroundColor: 'white' }}>
      <Grid container spacing={3}>
        {/* ... UI de búsqueda ... */}
      </Grid>
    </Paper>
  );
};