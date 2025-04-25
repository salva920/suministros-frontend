import React from 'react';
import { CssBaseline } from '@mui/material';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Importar componentes
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import ProcesarVenta from './components/ventas/ProcesarVenta';
import GenerarFactura from './components/ventas/GenerarFactura';
import RegistrarCliente from './components/clientes/RegistrarCliente';
import HistorialCompras from './components/clientes/HistorialCompras';
import ProgramaFidelizacion from './components/clientes/ProgramaFidelizacion';
import AgregarProducto from './components/AgregarProducto';
import ReportesFinancieros from './components/administracion/ReportesFinancieros';
import ControlFinanciero from './components/administracion/ControlFinanciero';
import GestionInventario from './components/inventario/GestionInventario';
import Administracion from './components/administracion/Administracion';
import Ventas from './components/ventas/Ventas';
import HistorialVentas from './components/ventas/HistorialVentas';
import Caja from './components/administracion/Caja';
import FacturasPendientes from './components/finanzas/FacturasPendientes';
import ListaPrecios from './components/precios/ListaPrecios';

const App = () => {
  return (
    <>
      <CssBaseline />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route index element={<Login />} />
            <Route path="/login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/ventas" element={<Ventas />} />
            <Route path="/ventas/procesar" element={<ProcesarVenta />} />
            <Route path="/ventas/factura/:id" element={<GenerarFactura />} />
            <Route path="/ventas/historial" element={<HistorialVentas />} />
            <Route path="/clientes/registrar" element={<RegistrarCliente />} />
            <Route path="/clientes/:id/historial" element={<HistorialCompras />} />
            <Route path="/clientes/:id/fidelizacion" element={<ProgramaFidelizacion />} />
            <Route path="/productos/agregar" element={<AgregarProducto />} />
            <Route path="/administracion/reportes" element={<ReportesFinancieros />} />
            <Route path="/administracion/control" element={<ControlFinanciero />} />
            <Route path="/inventario" element={<GestionInventario />} />
            <Route path="/administracion" element={<Administracion />} />
            <Route path="/administracion/caja" element={<Caja />} />
            <Route path="/finanzas/facturas-pendientes" element={<FacturasPendientes />} />
            <Route path="/precios" element={<ListaPrecios />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
      <ToastContainer />
    </>
  );
};

export default App;