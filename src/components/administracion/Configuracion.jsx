import React from 'react';
import { Container, Typography, Grid, Paper, TextField, Button } from '@mui/material';

const Configuracion = () => {
  return (
    <Container>
      <Typography variant="h4" gutterBottom>Configuración</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper style={{ padding: '1.5rem' }}>
            <Typography variant="h6" gutterBottom>Configuración General</Typography>
            <TextField
              label="Nombre de la Ferretería"
              fullWidth
              margin="normal"
            />
            <TextField
              label="Dirección"
              fullWidth
              margin="normal"
            />
            <TextField
              label="Teléfono"
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              style={{ marginTop: '1rem' }}
            >
              Guardar Cambios
            </Button>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper style={{ padding: '1.5rem' }}>
            <Typography variant="h6" gutterBottom>Configuración de Usuario</Typography>
            <TextField
              label="Nombre de Usuario"
              fullWidth
              margin="normal"
            />
            <TextField
              label="Contraseña"
              type="password"
              fullWidth
              margin="normal"
            />
            <Button
              variant="contained"
              color="primary"
              style={{ marginTop: '1rem' }}
            >
              Cambiar Contraseña
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Configuracion; 