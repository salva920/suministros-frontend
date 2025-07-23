import React, { useState, useEffect } from 'react';
import { 
  Container, Typography, Grid, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Button, TextField, Chip, IconButton, Box, MenuItem, 
  Select, FormControl, InputLabel, CircularProgress
} from '@mui/material';
import { Add, Delete, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { PieChart, Pie, LineChart, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';
import { toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import axios from 'axios';
import 'react-datepicker/dist/react-datepicker.css';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

const ControlFinanciero = () => {
  const [ventas, setVentas] = useState([]);
  const [gastos, setGastos] = useState([]);
  const [nuevoGasto, setNuevoGasto] = useState({ 
    descripcion: '', 
    monto: '', 
    categoria: '', 
    fecha: new Date() 
  });
  const [filtroFecha, setFiltroFecha] = useState({ start: null, end: null });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        // Configurar timeout y headers para axios
        const axiosConfig = {
          timeout: 15000,
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        };

        // Cargar todos los datos para cálculos correctos
        const ventasRes = await axios.get(`${API_URL}/ventas?getAll=true`, axiosConfig);
        const gastosRes = await axios.get(`${API_URL}/gastos?getAll=true`, axiosConfig);
        
        console.log('Respuesta de ventas:', ventasRes.data);
        console.log('Respuesta de gastos:', gastosRes.data);

        // Validación mejorada de las respuestas
        if (!ventasRes.data?.ventas || !Array.isArray(ventasRes.data.ventas)) {
          console.error('Estructura de respuesta de ventas inválida:', ventasRes.data);
          throw new Error('Estructura de respuesta de ventas inválida');
        }

        if (!gastosRes.data?.gastos || !Array.isArray(gastosRes.data.gastos)) {
          console.error('Estructura de respuesta de gastos inválida:', gastosRes.data);
          throw new Error('Estructura de respuesta de gastos inválida');
        }
        
        setVentas(ventasRes.data.ventas);
        setGastos(gastosRes.data.gastos);
        
        console.log('Datos cargados:', {
          totalVentas: ventasRes.data.ventas.length,
          totalGastos: gastosRes.data.gastos.length,
          totalVentasCalculado: ventasRes.data.ventas.reduce((acc, v) => acc + (v.total || 0), 0),
          totalGastosCalculado: gastosRes.data.gastos.reduce((acc, g) => acc + (g.monto || 0), 0)
        });
      } catch (error) {
        console.error('Error detallado al cargar datos:', {
          mensaje: error.message,
          respuesta: error.response?.data,
          estado: error.response?.status,
          config: error.config
        });

        let mensajeError = 'Error al cargar datos';
        if (error.response?.status === 400) {
          mensajeError = error.response.data.error || 'Error en la solicitud';
        } else if (error.code === 'ECONNABORTED') {
          mensajeError = 'La solicitud tardó demasiado tiempo';
        } else if (error.message.includes('CORS')) {
          mensajeError = 'Error de CORS: No se puede acceder al servidor';
        }

        toast.error(mensajeError);
      } finally {
        setCargando(false);
      }
    };
    
    cargarDatos();
  }, []);

  const handleAddGasto = async () => {
    try {
      const { descripcion, monto, categoria, fecha } = nuevoGasto;
      
      if (!descripcion || !monto || !categoria) {
        toast.error('Complete todos los campos requeridos');
        return;
      }

      const nuevoGastoData = {
        descripcion,
        monto: parseFloat(monto),
        categoria,
        fecha: fecha.toISOString()
      };

      const response = await axios.post(`${API_URL}/gastos`, nuevoGastoData, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      if (response.data) {
        setGastos(prev => [...prev, response.data]);
        setNuevoGasto({ descripcion: '', monto: '', categoria: '', fecha: new Date() });
        toast.success('Gasto registrado exitosamente');
      }
    } catch (error) {
      console.error('Error al registrar gasto:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        estado: error.response?.status
      });
      toast.error(error.response?.data?.error || 'Error al registrar gasto');
    }
  };

  const handleDeleteGasto = async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/gastos/${id}`, {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 200) {
        setGastos(prev => prev.filter(g => g._id !== id));
        toast.success('Gasto eliminado correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar gasto:', {
        mensaje: error.message,
        respuesta: error.response?.data,
        estado: error.response?.status
      });
      toast.error(error.response?.data?.error || 'Error al eliminar el gasto');
    }
  };

  const procesarDatos = () => {
    // Filtrar ventas por fecha si hay filtros aplicados
    const ventasFiltradas = ventas.filter(v => {
      if (!filtroFecha.start || !filtroFecha.end) return true;
      const fechaVenta = new Date(v.fecha);
      const start = new Date(filtroFecha.start);
      start.setHours(0, 0, 0, 0); // Inicio del día
      const end = new Date(filtroFecha.end);
      end.setHours(23, 59, 59, 999); // Fin del día
      return fechaVenta >= start && fechaVenta <= end;
    });

    // Filtrar gastos por fecha si hay filtros aplicados
    const gastosFiltrados = gastos.filter(g => {
      if (!filtroFecha.start || !filtroFecha.end) return true;
      const fechaGasto = new Date(g.fecha);
      const start = new Date(filtroFecha.start);
      start.setHours(0, 0, 0, 0); // Inicio del día
      const end = new Date(filtroFecha.end);
      end.setHours(23, 59, 59, 999); // Fin del día
      return fechaGasto >= start && fechaGasto <= end;
    });

    // Calcular totales usando los datos filtrados
    const totalVentas = ventasFiltradas.reduce((acc, v) => acc + (v.total || 0), 0);
    const totalGastos = gastosFiltrados.reduce((acc, g) => acc + (g.monto || 0), 0);
    const gananciaNeta = totalVentas - totalGastos;

    const categoriasGastos = [
      { name: 'Empresariales', value: gastosFiltrados.filter(g => g.categoria === 'empresariales').length },
      { name: 'Personales', value: gastosFiltrados.filter(g => g.categoria === 'personales').length },
    ];

    const datosTendencia = Array.from({ length: 12 }, (_, i) => {
      const mes = new Date(new Date().getFullYear(), i, 1);
      const ventasMes = ventas
        .filter(v => new Date(v.fecha).getMonth() === i)
        .reduce((acc, v) => acc + v.total, 0);
        
      const gastosMes = gastos
        .filter(g => new Date(g.fecha).getMonth() === i)
        .reduce((acc, g) => acc + g.monto, 0);

      return {
        name: mes.toLocaleString('default', { month: 'short' }),
        Beneficios: ventasMes - gastosMes
      };
    });

    return { totalVentas, totalGastos, gananciaNeta, categoriasGastos, datosTendencia, gastosFiltrados };
  };

  const { 
    totalVentas, 
    totalGastos, 
    gananciaNeta, 
    categoriasGastos, 
    datosTendencia, 
    gastosFiltrados 
  } = procesarDatos();

  const coloresGastos = ['#0088FE', '#00C49F'];

  if (cargando) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, backgroundColor: '#f8f9fa' }}>
        <Typography variant="h4" gutterBottom sx={{ 
          color: 'primary.main',
          fontWeight: 'bold',
          mb: 4,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          📊 Control Financiero
        </Typography>

        {/* Filtros */}
        <Paper sx={{ p: 2, mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <DatePicker
                selected={filtroFecha.start}
                onChange={date => setFiltroFecha(prev => ({ ...prev, start: date }))}
                placeholderText="Fecha inicial"
                className="date-picker"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <DatePicker
                selected={filtroFecha.end}
                onChange={date => setFiltroFecha(prev => ({ ...prev, end: date }))}
                placeholderText="Fecha final"
                className="date-picker"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button 
                variant="outlined" 
                onClick={() => setFiltroFecha({ start: null, end: null })}
                fullWidth
              >
                Limpiar Filtros
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Estadísticas Rápidas */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, backgroundColor: '#e8f5e9' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <ArrowUpward fontSize="large" color="success" />
                <div>
                  <Typography variant="h6">Ventas Totales</Typography>
                  <Typography variant="h4" color="green">
                    ${totalVentas.toFixed(2)}
                  </Typography>
                </div>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, backgroundColor: '#ffebee' }}>
              <Box display="flex" alignItems="center" gap={2}>
                <ArrowDownward fontSize="large" color="error" />
                <div>
                  <Typography variant="h6">Gastos Totales</Typography>
                  <Typography variant="h4" color="error">
                    ${totalGastos.toFixed(2)}
                  </Typography>
                </div>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, backgroundColor: gananciaNeta >= 0 ? '#e8f5e9' : '#ffebee' }}>
              <Typography variant="h6">Ganancia Neta</Typography>
              <Typography variant="h4" color={gananciaNeta >= 0 ? 'green' : 'error'}>
                ${gananciaNeta.toFixed(2)}
              </Typography>
              <Typography variant="caption">
                {gananciaNeta >= 0 ? 'Beneficio' : 'Pérdida'}
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Gráficos */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Distribución de Gastos
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <PieChart>
                  <Pie
                    data={categoriasGastos}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoriasGastos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={coloresGastos[index % coloresGastos.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '400px' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                Tendencia de Beneficios
              </Typography>
              <ResponsiveContainer width="100%" height="90%">
                <LineChart data={datosTendencia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Beneficios" stroke="#4caf50" activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        {/* Registro de Gastos */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>Registrar Nuevo Gasto</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TextField
                label="Descripción"
                fullWidth
                value={nuevoGasto.descripcion}
                onChange={e => setNuevoGasto({ ...nuevoGasto, descripcion: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <TextField
                label="Monto ($)"
                type="number"
                fullWidth
                value={nuevoGasto.monto}
                onChange={e => setNuevoGasto({ ...nuevoGasto, monto: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Categoría</InputLabel>
                <Select
                  value={nuevoGasto.categoria}
                  onChange={e => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
                >
                  <MenuItem value="empresariales">Empresariales</MenuItem>
                  <MenuItem value="personales">Personales</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <DatePicker
                selected={nuevoGasto.fecha}
                onChange={date => setNuevoGasto({ ...nuevoGasto, fecha: date })}
                dateFormat="dd/MM/yyyy"
                customInput={<TextField fullWidth />}
              />
            </Grid>
            <Grid item xs={12} md={1}>
              <Button 
                variant="contained" 
                color="primary" 
                fullWidth 
                onClick={handleAddGasto}
                startIcon={<Add />}
              >
                Agregar
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Listado de Gastos */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: 'primary.main' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white' }}>Descripción</TableCell>
                  <TableCell sx={{ color: 'white' }}>Categoría</TableCell>
                  <TableCell sx={{ color: 'white' }} align="right">Monto</TableCell>
                  <TableCell sx={{ color: 'white' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {gastosFiltrados.map((gasto) => (
                  <TableRow key={gasto._id} hover>
                    <TableCell>{new Date(gasto.fecha).toLocaleDateString()}</TableCell>
                    <TableCell>{gasto.descripcion}</TableCell>
                    <TableCell>
                      <Chip 
                        label={gasto.categoria} 
                        color={gasto.categoria === 'empresariales' ? 'primary' : 'secondary'}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                      ${gasto.monto.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleDeleteGasto(gasto._id)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Paper>
    </Container>
  );
};

export default ControlFinanciero;