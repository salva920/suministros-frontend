import React, { useState, useEffect } from 'react';
import { Container, Typography, List, ListItem, ListItemText } from '@mui/material';

const HistorialCompras = ({ clienteId }) => {
  const [compras, setCompras] = useState([]);
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    const clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const clienteEncontrado = clientes.find(c => c.id === clienteId);
    setCliente(clienteEncontrado);

    const ventas = JSON.parse(localStorage.getItem('ventas')) || [];
    const comprasCliente = ventas.filter(v => v.clienteId === clienteId);
    setCompras(comprasCliente);
  }, [clienteId]);

  if (!cliente) {
    return <Typography>Cliente no encontrado</Typography>;
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Historial de Compras de {cliente.nombre}
      </Typography>
      <List>
        {compras.map((compra, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={`Compra #${index + 1}`}
              secondary={`Fecha: ${new Date(compra.fecha).toLocaleDateString()} - Total: $${compra.total.toFixed(2)}`}
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default HistorialCompras; 