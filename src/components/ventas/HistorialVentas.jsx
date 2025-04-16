import React, { useState, useEffect } from 'react';
import { 
  Container, Paper,Typography,Tabs, Tab
} from '@mui/material';
import { toast } from 'react-hot-toast';
import GenerarFactura from './GenerarFactura';
import { useNavigate } from 'react-router-dom';
import RegistroClienteDialog from './RegistroClienteDialog';
import ListadoHistorialVentas from './ListadoHistorialVentas.jsx';

const HistorialVentas = () => {
  const [ventasOriginales, setVentasOriginales] = useState([]);
  const [ventasClienteSeleccionado, setVentasClienteSeleccionado] = useState([]);
  const [mostrarModalCliente, setMostrarModalCliente] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [deudaTotal, setDeudaTotal] = useState(0);
  const [montoAbonar, setMontoAbonar] = useState(0);
  const [setMostrarCampos] = useState(false);
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null);
  const [mostrarGenerarFactura, setMostrarGenerarFactura] = useState(false);
  const navigate = useNavigate();

  // Función para cambiar de pestaña
  const handleChangeTab = (event, newValue) => {
    if (newValue === 0) {
      navigate('/ventas/procesar'); // Navegar a "Nueva Venta"
    } else if (newValue === 1) {
      navigate('/ventas/historial'); // Navegar a "Historial de Ventas"
    }
  };

  // Cargar ventas al iniciar
  const cargarVentas = () => {
    const ventasStorage = JSON.parse(localStorage.getItem('ventas')) || [];
    setVentasOriginales(ventasStorage);
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  // Función para actualizar ventas globalmente
  const actualizarVentasGlobales = (ventaActualizada) => {
    const nuevasVentas = ventasOriginales.map(v => 
      v.id === ventaActualizada.id ? ventaActualizada : v
    );
    setVentasOriginales(nuevasVentas);
    localStorage.setItem('ventas', JSON.stringify(nuevasVentas));
  };

  const handleVerCliente = (cliente) => {
    const ventasDelCliente = ventasOriginales.filter(v => 
      v.cliente?.rif === cliente.rif
    );
    setClienteSeleccionado(cliente);
    setVentasClienteSeleccionado(ventasDelCliente);
    setMostrarModalCliente(true);
    // Calcular deuda total
    const deuda = ventasDelCliente.reduce((acc, venta) => acc + venta.saldoPendiente, 0);
    setDeudaTotal(deuda);
  };

  // Función para cerrar el diálogo de generación de factura
  const handleCerrarGenerarFactura = () => {
    setMostrarGenerarFactura(false);
    setVentaSeleccionada(null);
  };

  // Función para cerrar el diálogo
  const handleCerrarRegistroCliente = () => {
    setMostrarModalCliente(false);
    setClienteSeleccionado(null);
    setVentasClienteSeleccionado([]);
    setDeudaTotal(0);
    setMontoAbonar(0);
    setMostrarCampos(false);
  };

  // Función para abonar saldo
  const handleAbonarSaldo = (venta) => {
    if (montoAbonar <= 0 || montoAbonar > venta.saldoPendiente) {
      toast.error('Monto inválido');
      return;
    }

    const ventaActualizada = {
      ...venta,
      montoAbonado: venta.montoAbonado + montoAbonar,
      saldoPendiente: venta.saldoPendiente - montoAbonar
    };

    // Actualización global
    actualizarVentasGlobales(ventaActualizada);
    
    // Actualización del cliente seleccionado
    const nuevasVentasCliente = ventasClienteSeleccionado.map(v => 
      v.id === venta.id ? ventaActualizada : v
    );
    setVentasClienteSeleccionado(nuevasVentasCliente);
    setDeudaTotal(prev => prev - montoAbonar);
    setMontoAbonar(0);
    toast.success('Abono realizado con éxito');
  };

  // Función para solventar deuda
  const handleSolventarDeuda = () => {
    const ventasActualizadas = ventasClienteSeleccionado.map(v => ({
      ...v,
      montoAbonado: v.montoAbonado + v.saldoPendiente,
      saldoPendiente: 0
    }));

    // Actualizar todas las ventas
    const nuevasVentasGlobales = ventasOriginales.map(v => {
      const ventaActualizada = ventasActualizadas.find(av => av.id === v.id);
      return ventaActualizada || v;
    });
    
    setVentasOriginales(nuevasVentasGlobales);
    localStorage.setItem('ventas', JSON.stringify(nuevasVentasGlobales));
    
    setVentasClienteSeleccionado(ventasActualizadas);
    setDeudaTotal(0);
    toast.success('Deuda solventada con éxito');
  };

  // Función para imprimir factura
  const handleImprimirFactura = (venta) => {
    toast.success('Factura generada con éxito');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Título y pestañas principales */}
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa', mb: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'primary.main',
          fontWeight: 'bold',
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          Procesar Venta
        </Typography>

        <Tabs 
          value={1} // Valor fijo para "Historial de Ventas"
          onChange={handleChangeTab} 
          aria-label="Pestañas de Procesar Venta"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: 'primary.main',
            },
          }}
        >
          <Tab label="Nueva Venta" sx={{ fontWeight: 'bold' }} />
          <Tab label="Historial de Ventas" sx={{ fontWeight: 'bold' }} />
        </Tabs>
      </Paper>

      {/* Listado de ventas */}
      <ListadoHistorialVentas 
        ventas={ventasOriginales} // Mostrar todas las ventas
        handleVerCliente={handleVerCliente}
      />

      {/* Diálogo para ver el registro del cliente */}
      <RegistroClienteDialog
        open={mostrarModalCliente}
        onClose={handleCerrarRegistroCliente}
        clienteSeleccionado={clienteSeleccionado}
        ventasCliente={ventasClienteSeleccionado}
        deudaTotal={deudaTotal}
        montoAbonar={montoAbonar}
        setMontoAbonar={setMontoAbonar}
        handleAbonarSaldo={handleAbonarSaldo}
        handleImprimirFactura={handleImprimirFactura}
        handleSolventarDeuda={handleSolventarDeuda}
      />

      {/* Diálogo para Generar Factura */}
      {mostrarGenerarFactura && (
        <GenerarFactura 
          venta={ventaSeleccionada} 
          onClose={handleCerrarGenerarFactura} 
        />
      )}
    </Container>
  );
};

export default HistorialVentas;