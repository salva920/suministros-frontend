import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Select, MenuItem, FormControl, InputLabel, CircularProgress, Box } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import moment from 'moment';
import 'moment/locale/es';

const API_URL = "https://suministros-backend.vercel.app/api";

const ReportesFinancieros = () => {
  const [ventas, setVentas] = useState([]);
  const [periodo, setPeriodo] = useState('mes');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarVentas = async () => {
      setCargando(true);
      setError(null);
      try {
        // Calcular fechas para el filtro
        let fechaInicio, fechaFin;
        
        if (periodo === 'mes') {
          // Mostrar desde enero hasta el mes actual
          fechaInicio = moment('2025-01-01').startOf('month').toISOString();
          fechaFin = moment('2025-01-31').endOf('day').toISOString();
        } else if (periodo === 'semana') {
          // Mostrar la última semana de enero
          fechaInicio = moment('2025-01-25').startOf('day').toISOString();
          fechaFin = moment('2025-01-31').endOf('day').toISOString();
        } else {
          // Mostrar el último día de enero
          fechaInicio = moment('2025-01-31').startOf('day').toISOString();
          fechaFin = moment('2025-01-31').endOf('day').toISOString();
        }

        console.log('Fechas de búsqueda:', {
          fechaInicio: moment(fechaInicio).format('YYYY-MM-DD HH:mm:ss'),
          fechaFin: moment(fechaFin).format('YYYY-MM-DD HH:mm:ss')
        });

        const response = await axios.get(`${API_URL}/ventas`, {
          params: {
            fechaInicio,
            fechaFin,
            populate: 'cliente',
            getAll: true
          }
        });

        if (response.data && response.data.ventas) {
          console.log('Ventas recibidas:', response.data.ventas.length);
          setVentas(response.data.ventas);
        } else {
          throw new Error('Formato de respuesta inválido');
        }
      } catch (error) {
        console.error('Error al cargar ventas:', error);
        setError('Error al cargar los datos. Por favor, intente nuevamente.');
      } finally {
        setCargando(false);
      }
    };

    cargarVentas();
  }, [periodo]);

  const getDatosGrafico = () => {
    if (!ventas || ventas.length === 0) return [];

    const datos = [];

    if (periodo === 'mes') {
      // Mostrar solo enero
      const ventasEnero = ventas.filter(v => {
        const fechaVenta = moment(v.fecha);
        return fechaVenta.month() === 0 && fechaVenta.year() === 2025;
      });
      
      const total = ventasEnero.reduce((acc, v) => acc + (v.total || 0), 0);
      
      datos.push({
        name: 'Enero 2025',
        Ventas: total,
        Cantidad: ventasEnero.length
      });
    } else if (periodo === 'semana') {
      // Última semana de enero
      for (let i = 6; i >= 0; i--) {
        const dia = moment('2025-01-31').subtract(i, 'days');
        const ventasDelDia = ventas.filter(v => {
          const fechaVenta = moment(v.fecha);
          return fechaVenta.isSame(dia, 'day');
        });
        
        const total = ventasDelDia.reduce((acc, v) => acc + (v.total || 0), 0);
        
        datos.push({
          name: dia.format('ddd DD/01'),
          Ventas: total,
          Cantidad: ventasDelDia.length
        });
      }
    } else {
      // Ventas del último día de enero
      const ventasDia = ventas.filter(v => {
        const fechaVenta = moment(v.fecha);
        return fechaVenta.isSame(moment('2025-01-31'), 'day');
      });

      // Agrupar por hora
      for (let i = 0; i < 24; i++) {
        const ventasHora = ventasDia.filter(v => {
          const fechaVenta = moment(v.fecha);
          return fechaVenta.hour() === i;
        });
        
        const total = ventasHora.reduce((acc, v) => acc + (v.total || 0), 0);
        
        datos.push({
          name: `${i.toString().padStart(2, '0')}:00`,
          Ventas: total,
          Cantidad: ventasHora.length
        });
      }
    }

    console.log('Datos del gráfico:', datos);
    return datos;
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        Reportes Financieros
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <FormControl fullWidth>
              <InputLabel>Periodo</InputLabel>
              <Select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
                label="Periodo"
              >
                <MenuItem value="mes">Últimos 12 meses</MenuItem>
                <MenuItem value="semana">Última semana</MenuItem>
                <MenuItem value="dia">Ventas del día</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3, height: '500px' }}>
            {cargando ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress />
              </Box>
            ) : error ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <Typography color="error">{error}</Typography>
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getDatosGrafico()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={70}
                    interval={0}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#2196f3" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'Ventas') return [`$${value.toFixed(2)}`, 'Ventas'];
                      return [value, 'Cantidad de ventas'];
                    }}
                    labelFormatter={(label) => `Fecha: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="Ventas" 
                    fill="#2196f3"
                    radius={[4, 4, 0, 0]}
                  />
                  {(periodo === 'semana' || periodo === 'dia') && (
                    <Bar 
                      yAxisId="right"
                      dataKey="Cantidad" 
                      fill="#82ca9d"
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              </ResponsiveContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportesFinancieros; 