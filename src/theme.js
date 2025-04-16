import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  spacing: 4, // Base de espaciado
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  // ... otras configuraciones
});

export default theme; 