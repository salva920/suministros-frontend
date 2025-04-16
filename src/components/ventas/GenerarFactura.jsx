import React, { useRef } from 'react';
import { 
  Container, Typography, List, ListItem, ListItemText, 
  Button, Dialog, DialogContent, DialogActions, Box 
} from '@mui/material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const GenerarFactura = ({ venta, onClose }) => {
  const componentRef = useRef();

  const handlePrint = () => {
    const input = componentRef.current;

    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Factura_${venta.nrFactura}.pdf`); // Nombre del archivo PDF
      onClose(); // Cerrar el modal después de imprimir
    });
  };

  if (!venta) return <Typography>Venta no encontrada</Typography>;

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent>
        <Container>
          {/* Contenedor de la factura con estilos específicos */}
          <div 
            ref={componentRef} 
            style={{ 
              padding: '20px',
              backgroundColor: '#ffffff',
              width: '210mm', // Ancho estándar A4
              minHeight: '297mm', // Alto estándar A4
              margin: '0 auto',
              boxShadow: '0 0 10px rgba(0,0,0,0.1)'
            }}
          >
            {/* Encabezado */}
            <Box sx={{ borderBottom: '2px solid #000', mb: 3 }}>
              <Typography variant="h4" gutterBottom>
                Factura #{venta.nrFactura}
              </Typography>
              <Typography variant="h6">
                {venta.cliente?.nombre || 'Cliente no registrado'}
              </Typography>
              <Typography>RIF: {venta.cliente?.rif || 'N/A'}</Typography>
              <Typography>
                Fecha: {new Date(venta.fecha).toLocaleDateString('es-VE')}
              </Typography>
            </Box>

            {/* Detalles de la venta */}
            <List dense>
              <ListItem sx={{ bgcolor: '#f5f5f5', fontWeight: 'bold' }}>
                <ListItemText 
                  primary="Producto" 
                  secondary="Cantidad | Precio Unitario" 
                />
                <Typography variant="body2" sx={{ minWidth: 100 }}>
                  Total
                </Typography>
              </ListItem>
              
              {venta.productos.map((item, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={item.producto?.nombre || 'Producto no disponible'}
                    secondary={`${item.cantidad} x $${item.precioUnitario !== undefined ? item.precioUnitario.toFixed(2) : 'N/A'}`}
                  />
                  <Typography>
                    ${(item.cantidad * (item.precioUnitario || 0)).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
            </List>

            {/* Totales */}
            <Box sx={{ 
              mt: 4, 
              padding: '20px', 
              backgroundColor: '#fafafa',
              borderTop: '2px solid #000'
            }}>
              <Typography variant="h6" align="right">
                Total General: ${venta.total.toFixed(2)}
              </Typography>
              {venta.saldoPendiente > 0 && (
                <Typography variant="body2" align="right" color="error">
                  Saldo Pendiente: ${venta.saldoPendiente.toFixed(2)}
                </Typography>
              )}
            </Box>
          </div>

          {/* Botones de acción */}
          <Box sx={{ 
            mt: 2, 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2 
          }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handlePrint}
              sx={{ minWidth: 150 }}
            >
              Descargar PDF
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </Box>
        </Container>
      </DialogContent>
    </Dialog>
  );
};

export default GenerarFactura;