// src/components/ventas/hooks/useSales.js
import { useState, useEffect, useContext } from 'react';
import { toast } from 'react-toastify';
import { TasaCambioContext } from '../../../context/TasaCambioContext';

export const useSales = () => {
  const { tasaPromedio } = useContext(TasaCambioContext);
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [productosVenta, setProductosVenta] = useState([]);
  const [cliente, setCliente] = useState(null);

  useEffect(() => {
    // Cargar datos iniciales
    const loadData = () => {
      const ventasStorage = JSON.parse(localStorage.getItem('ventas')) || [];
      const productosStorage = JSON.parse(localStorage.getItem('productos')) || [];
      const clientesStorage = JSON.parse(localStorage.getItem('clientes')) || [];
      
      setVentas(ventasStorage);
      setProductos(productosStorage.map((p, i) => ({
        ...p,
        id: p.id || `prod-${Date.now()}-${i}`
      })));
      setClientes(clientesStorage);
    };

    loadData();
  }, []);

  const finalizarVenta = () => {
    // Lógica de finalizar venta...
  };

  const handleAgregarProducto = (producto) => {
    // Lógica para agregar producto...
  };

  return {
    ventas,
    productos,
    clientes,
    productosVenta,
    cliente,
    setCliente,
    setProductosVenta,
    finalizarVenta,
    handleAgregarProducto,
    tasaPromedio
  };
};