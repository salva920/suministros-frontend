import React, { useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Notificaciones = () => {
  useEffect(() => {
    const checkStock = () => {
      try {
        // Obtener productos de localStorage
        const productos = JSON.parse(localStorage.getItem('productos')) || [];
        
        // Filtrar productos con bajo stock
        const lowStockProducts = productos.filter(p => p.stock < 5);
        
        if (lowStockProducts.length > 0) {
          const productNames = lowStockProducts.map(p => p.nombre).join(', ');
          toast.warning(
            `¡Atención! Los siguientes productos necesitan reposición: ${productNames}`, 
            {
              position: "top-right",
              autoClose: 15000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
            }
          );
        }
      } catch (error) {
        toast.error('Error al verificar el stock. Por favor, inténtelo de nuevo.', {
          position: "top-right",
          autoClose: 5000,
        });
        console.error('Error checking stock:', error);
      }
    };

    const interval = setInterval(checkStock, 60000);
    checkStock();
    
    return () => clearInterval(interval);
  }, []);

  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      limit={3}
    />
  );
};

export default Notificaciones; 