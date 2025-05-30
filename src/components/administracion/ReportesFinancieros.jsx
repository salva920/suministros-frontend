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
        const fechaFin = moment().endOf('day').toISOString();
        let fechaInicio;
        
        if (periodo === 'mes') {
          fechaInicio = moment().subtract(11, 'months').startOf('month').toISOString();
        } else if (periodo === 'semana') {
          fechaInicio = moment().subtract(6, 'days').startOf('day').toISOString();
        } else {
          fechaInicio = moment().startOf('day').toISOString();
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
    const ahora = moment();

    if (periodo === 'mes') {
      // Últimos 12 meses desde el mes actual
      for (let i = 11; i >= 0; i--) {
        const mes = moment().subtract(i, 'months');
        const ventasDelMes = ventas.filter(v => {
          const fechaVenta = moment(v.fecha);
          return fechaVenta.isSame(mes, 'month') && fechaVenta.isSame(mes, 'year');
        });
        
        const total = ventasDelMes.reduce((acc, v) => acc + (v.total || 0), 0);
        
        datos.push({
          name: mes.format('MMM YYYY'),
          Ventas: total,
          Cantidad: ventasDelMes.length
        });
      }
    } else if (periodo === 'semana') {
      // Últimos 7 días desde hoy
      for (let i = 6; i >= 0; i--) {
        const dia = moment().subtract(i, 'days');
        const ventasDelDia = ventas.filter(v => {
          const fechaVenta = moment(v.fecha);
          return fechaVenta.isSame(dia, 'day');
        });
        
        const total = ventasDelDia.reduce((acc, v) => acc + (v.total || 0), 0);
        
        datos.push({
          name: dia.format('ddd DD/MM'),
          Ventas: total,
          Cantidad: ventasDelDia.length
        });
      }
    } else {
      // Ventas del día actual
      const ventasHoy = ventas.filter(v => {
        const fechaVenta = moment(v.fecha);
        return fechaVenta.isSame(ahora, 'day');
      });

      // Si no hay ventas hoy, mostrar las últimas 24 horas
      if (ventasHoy.length === 0) {
        for (let i = 23; i >= 0; i--) {
          const hora = moment().subtract(i, 'hours');
          datos.push({
            name: hora.format('HH:00'),
            Ventas: 0,
            Cantidad: 0
          });
        }
      } else {
        // Agrupar por hora
        for (let i = 0; i < 24; i++) {
          const ventasHora = ventasHoy.filter(v => {
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