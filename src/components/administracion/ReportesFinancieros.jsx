import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Paper, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const API_URL = "https://suministros-backend.vercel.app/api"; // URL de tu backend en Vercel

const ReportesFinancieros = () => {
  const [ventas, setVentas] = useState([]);
  const [periodo, setPeriodo] = useState('mes');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarVentas = async () => {
      setCargando(true);
      try {
        const response = await axios.get(`${API_URL}/ventas?limit=1000`);
        setVentas(response.data.ventas);
      } catch (error) {
        console.error('Error al cargar ventas:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarVentas();
  }, [setCargando]);

  const getDatosGrafico = () => {
    const ahora = new Date();
    const datos = [];

    if (periodo === 'mes') {
      for (let i = 0; i < 12; i++) {
        const mes = new Date(ahora.getFullYear(), i, 1);
        const total = ventas
          .filter(v => new Date(v.fecha).getMonth() === i && new Date(v.fecha).getFullYear() === ahora.getFullYear())
          .reduce((acc, v) => acc + v.total, 0);
        
        datos.push({
          name: mes.toLocaleString('default', { month: 'short' }),
          Ventas: total
        });
      }
    } else if (periodo === 'semana') {
      for (let i = 0; i < 7; i++) {
        const dia = new Date(ahora.setDate(ahora.getDate() - i));
        const total = ventas
          .filter(v => new Date(v.fecha).toDateString() === dia.toDateString())
          .reduce((acc, v) => acc + v.total, 0);
        
        datos.push({
          name: dia.toLocaleString('default', { weekday: 'short' }),
          Ventas: total
        });
      }
    }

    return datos.reverse();
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Reportes Financieros</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper style={{ padding: '1rem' }}>
            <FormControl fullWidth>
              <InputLabel>Periodo</InputLabel>
              <Select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <MenuItem value="mes">Últimos 12 meses</MenuItem>
                <MenuItem value="semana">Última semana</MenuItem>
              </Select>
            </FormControl>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper style={{ padding: '1rem', height: '400px' }}>
            <ResponsiveContainer width="100%" height="100%">
              {cargando ? (
                <p>Cargando...</p>
              ) : (
                <BarChart data={getDatosGrafico()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Ventas" fill="#8884d8" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReportesFinancieros; 