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
  const [ultimoMesConVentas, setUltimoMesConVentas] = useState(null);

  // Función para encontrar el último mes con ventas
  const encontrarUltimoMesConVentas = (ventas) => {
    if (!ventas || ventas.length === 0) return null;

    const ventasPorMes = ventas.reduce((acc, venta) => {
      const fecha = moment(venta.fecha);
      const mesKey = fecha.format('YYYY-MM');
      if (!acc[mesKey]) {
        acc[mesKey] = {
          fecha: fecha,
          total: 0
        };
      }
      acc[mesKey].total += venta.total || 0;
      return acc;
    }, {});

    const mesesConVentas = Object.values(ventasPorMes)
      .filter(mes => mes.total > 0)
      .sort((a, b) => b.fecha - a.fecha);

    return mesesConVentas.length > 0 ? mesesConVentas[0].fecha : null;
  };

  useEffect(() => {
    const cargarVentas = async () => {
      setCargando(true);
      setError(null);
      try {
        // Primero cargar todas las ventas para encontrar el último mes
        const responseInicial = await axios.get(`${API_URL}/ventas`, {
          params: {
            getAll: true,
            populate: 'cliente'
          }
        });

        if (responseInicial.data && responseInicial.data.ventas) {
          const ultimoMes = encontrarUltimoMesConVentas(responseInicial.data.ventas);
          setUltimoMesConVentas(ultimoMes);
          
          if (!ultimoMes) {
            setError('No se encontraron ventas');
            return;
          }

          // Calcular fechas para el filtro basado en el último mes con ventas
          let fechaInicio, fechaFin;
          
          if (periodo === 'mes') {
            fechaInicio = ultimoMes.clone().startOf('month').toISOString();
            fechaFin = ultimoMes.clone().endOf('month').toISOString();
          } else if (periodo === 'semana') {
            fechaInicio = ultimoMes.clone().subtract(6, 'days').startOf('day').toISOString();
            fechaFin = ultimoMes.clone().endOf('day').toISOString();
          } else {
            fechaInicio = ultimoMes.clone().startOf('day').toISOString();
            fechaFin = ultimoMes.clone().endOf('day').toISOString();
          }

          console.log('Fechas de búsqueda:', {
            fechaInicio: moment(fechaInicio).format('YYYY-MM-DD HH:mm:ss'),
            fechaFin: moment(fechaFin).format('YYYY-MM-DD HH:mm:ss')
          });

          // Cargar ventas para el período específico
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
          }
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
    if (!ventas || ventas.length === 0 || !ultimoMesConVentas) return [];

    const datos = [];
    const ultimoMes = moment(ultimoMesConVentas);

    if (periodo === 'mes') {
      // Mostrar el último mes con ventas
      const ventasDelMes = ventas.filter(v => {
        const fechaVenta = moment(v.fecha);
        return fechaVenta.isSame(ultimoMes, 'month') && fechaVenta.isSame(ultimoMes, 'year');
      });
      
      const total = ventasDelMes.reduce((acc, v) => acc + (v.total || 0), 0);
      
      datos.push({
        name: ultimoMes.format('MMMM YYYY'),
        Ventas: total,
        Cantidad: ventasDelMes.length
      });
    } else if (periodo === 'semana') {
      // Última semana del mes con ventas
      for (let i = 6; i >= 0; i--) {
        const dia = ultimoMes.clone().subtract(i, 'days');
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
      // Ventas del último día con ventas
      const ventasDia = ventas.filter(v => {
        const fechaVenta = moment(v.fecha);
        return fechaVenta.isSame(ultimoMes, 'day');
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
                <MenuItem value="mes">Último mes con ventas</MenuItem>
                <MenuItem value="semana">Última semana con ventas</MenuItem>
                <MenuItem value="dia">Último día con ventas</MenuItem>
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