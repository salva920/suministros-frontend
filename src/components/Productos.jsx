import React, { useEffect, useState } from 'react';
import { Button, Container, Typography, List, ListItem, ListItemText, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

const Productos = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    const fetchProductos = () => {
      try {
        setLoading(true);
        const productosStorage = JSON.parse(localStorage.getItem('productos')) || [];
        setProductos(productosStorage);
        
        // Verificar productos con bajo stock
        const lowStock = productosStorage.filter(p => p.stock < 5);
        if (lowStock.length > 0) {
          toast.warning(
            `${lowStock.length} productos con bajo stock`, 
            {
              position: "top-right",
              autoClose: 10000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            }
          );
        }
      } catch (error) {
        toast.error('Error al cargar los productos. Intente nuevamente.', {
          position: "top-right",
          autoClose: 5000,
        });
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []);

  const filteredProducts = selectedCategory 
    ? productos.filter(p => p.categoria === selectedCategory)
    : productos;

  if (loading) {
    return (
      <Container>
        <Typography variant="h6" align="center" sx={{ mt: 4 }}>
          Cargando productos...
        </Typography>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Lista de Productos</Typography>
      <Button variant="contained" color="primary" component={Link} to="/agregar">
        Agregar Producto
      </Button>
      <FormControl fullWidth margin="normal">
        <InputLabel>Categoría</InputLabel>
        <Select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <MenuItem value="">Todas las categorías</MenuItem>
          {[...new Set(productos.map(p => p.categoria))].map(cat => (
            <MenuItem key={cat} value={cat}>{cat}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <List>
        {filteredProducts.map((producto, index) => (
          <ListItem key={index}>
            <ListItemText 
              primary={producto.nombre} 
              secondary={`
                Precio: $${producto.precio.toFixed(2)} | 
                Stock: ${producto.stock} | 
                Ingreso: ${new Date(producto.fechaIngreso).toLocaleDateString()}
              `} 
            />
          </ListItem>
        ))}
      </List>
    </Container>
  );
};

export default Productos;