import React, { useState, useEffect } from 'react';
import { Container, Typography, Chip } from '@mui/material';

const ProgramaFidelizacion = ({ clienteId }) => {
  const [puntos, setPuntos] = useState(0);
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const clienteEncontrado = clientes.find(c => c.id === clienteId);
    setCliente(clienteEncontrado);

    const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
    const comprasCliente = ventas.filter(v => v.clienteId === clienteId);
    const totalPuntos = comprasCliente.reduce((acc, compra) => acc + Math.floor(compra.total), 0);
    setPuntos(totalPuntos);
  }, [clienteId]);

  if (!cliente) {
    return <Typography>Cliente no encontrado</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Programa de Fidelización
      </Typography>
      <Typography variant="h6" gutterBottom>
        Cliente: {cliente.nombre}
      </Typography>
      <Chip
        label={`Puntos acumulados: ${puntos}`}
        color="primary"
        variant="outlined"
        style={{ fontSize: '1.2rem', padding: '1rem' }}
      />
      <Typography variant="body1" style={{ marginTop: '1rem' }}>
        Por cada $1 gastado, ganas 1 punto. ¡Acumula puntos y obtén descuentos especiales!
      </Typography>
    </Container>
  );
};

export default ProgramaFidelizacion; 