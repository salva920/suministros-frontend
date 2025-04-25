import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Button, Form, Modal, Badge, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaMoneyBillWave, FaFileInvoiceDollar, FaSearch, FaCalendarAlt } from 'react-icons/fa';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import './FacturasPendientes.css'; // Crearemos este archivo después

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const FacturasPendientes = () => {
  const [facturas, setFacturas] = useState([]);
  const [facturasFiltradas, setFacturasFiltradas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAbonoModal, setShowAbonoModal] = useState(false);
  const [currentFactura, setCurrentFactura] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('pendientes');
  const [busqueda, setBusqueda] = useState('');
  const [montoAbono, setMontoAbono] = useState('');
  const [errorAbono, setErrorAbono] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Función para cargar las facturas, optimizada con useCallback
  const cargarFacturas = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // URL base
      let url = `${API_URL}/facturas-pendientes`;
      
      // Parámetros de filtrado
      const params = new URLSearchParams();
      if (filtroEstado !== 'todas') {
        params.append('estado', filtroEstado);
      }
      if (fechaDesde) {
        params.append('fechaDesde', fechaDesde);
      }
      if (fechaHasta) {
        params.append('fechaHasta', fechaHasta);
      }
      
      // Añadir parámetros a la URL si existen
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
      
      const response = await axios.get(url);
      setFacturas(response.data);
      aplicarFiltros(response.data);
    } catch (error) {
      console.error('Error al cargar facturas pendientes:', error);
      toast.error('No se pudieron cargar las facturas pendientes');
    } finally {
      setIsLoading(false);
    }
  }, [filtroEstado, fechaDesde, fechaHasta]);

  // Cargar facturas al montar el componente o cuando cambien los filtros
  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  // Aplicar filtros de búsqueda de texto
  const aplicarFiltros = useCallback((datos) => {
    if (!busqueda.trim()) {
      setFacturasFiltradas(datos);
      return;
    }
    
    const terminoBusqueda = busqueda.toLowerCase().trim();
    const resultado = datos.filter(factura => 
      factura.concepto.toLowerCase().includes(terminoBusqueda) ||
      factura.proveedor?.toLowerCase().includes(terminoBusqueda) ||
      factura.numeroFactura?.toLowerCase().includes(terminoBusqueda)
    );
    
    setFacturasFiltradas(resultado);
  }, [busqueda]);

  // Aplicar filtros cuando cambia la búsqueda
  useEffect(() => {
    aplicarFiltros(facturas);
  }, [facturas, busqueda, aplicarFiltros]);

  // Función para formatear fecha
  const formatearFecha = (fecha) => {
    try {
      return format(parseISO(fecha), 'dd/MM/yyyy', { locale: es });
    } catch (error) {
      return 'Fecha inválida';
    }
  };

  // Función para formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor);
  };

  // Abrir modal de abono
  const abrirModalAbono = (factura) => {
    setCurrentFactura(factura);
    setMontoAbono('');
    setErrorAbono('');
    setShowAbonoModal(true);
  };

  // Registrar abono
  const registrarAbono = async () => {
    // Validar monto
    const monto = parseFloat(montoAbono);
    if (isNaN(monto) || monto <= 0) {
      setErrorAbono('El monto debe ser un número positivo');
      return;
    }
    
    if (monto > currentFactura.saldo) {
      setErrorAbono('El abono no puede ser mayor al saldo pendiente');
      return;
    }
    
    try {
      setIsLoading(true);
      await axios.post(`${API_URL}/facturas-pendientes/${currentFactura._id}/abonos`, {
        monto,
        fecha: new Date().toISOString()
      });
      
      toast.success('Abono registrado correctamente');
      setShowAbonoModal(false);
      cargarFacturas(); // Recargar facturas para ver el saldo actualizado
    } catch (error) {
      console.error('Error al registrar abono:', error);
      toast.error('No se pudo registrar el abono');
    } finally {
      setIsLoading(false);
    }
  };

  // Resetear filtros
  const resetearFiltros = () => {
    setBusqueda('');
    setFiltroEstado('pendientes');
    setFechaDesde('');
    setFechaHasta('');
  };

  return (
    <Container fluid className="facturas-pendientes-container py-4">
      <h2 className="mb-4 text-primary">
        <FaFileInvoiceDollar className="me-2" />
        Facturas Pendientes por Pagar
      </h2>
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Filtros</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6} lg={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small text-muted">
                  <FaSearch className="me-1" /> Buscar
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Buscar por concepto, proveedor..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small text-muted">Estado</Form.Label>
                <Form.Select
                  value={filtroEstado}
                  onChange={(e) => setFiltroEstado(e.target.value)}
                >
                  <option value="pendientes">Pendientes</option>
                  <option value="pagadas">Pagadas</option>
                  <option value="parciales">Pago Parcial</option>
                  <option value="todas">Todas</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6} lg={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small text-muted">
                  <FaCalendarAlt className="me-1" /> Desde
                </Form.Label>
                <Form.Control
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6} lg={3} className="mb-3">
              <Form.Group>
                <Form.Label className="small text-muted">
                  <FaCalendarAlt className="me-1" /> Hasta
                </Form.Label>
                <Form.Control
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex justify-content-end">
            <Button 
              variant="secondary" 
              size="sm"
              onClick={resetearFiltros}
              className="me-2"
            >
              Limpiar
            </Button>
            <Button 
              variant="primary" 
              size="sm"
              onClick={cargarFacturas}
            >
              Aplicar Filtros
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Card className="shadow-sm">
        <Card.Header className="d-flex justify-content-between align-items-center bg-light">
          <h5 className="mb-0">Listado de Facturas</h5>
          <span className="badge bg-primary rounded-pill">
            {facturasFiltradas.length} registros
          </span>
        </Card.Header>
        <Card.Body className="p-0">
          {isLoading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Cargando facturas...</p>
            </div>
          ) : facturasFiltradas.length === 0 ? (
            <div className="text-center py-5">
              <p className="text-muted">No se encontraron facturas pendientes</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="mb-0 tabla-facturas">
                <thead className="table-light">
                  <tr>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th className="text-end">Monto</th>
                    <th className="text-end">Abono</th>
                    <th className="text-end">Saldo</th>
                    <th className="text-center">Estado</th>
                    <th className="text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {facturasFiltradas.map(factura => (
                    <tr key={factura._id} className={factura.saldo === 0 ? 'table-success' : ''}>
                      <td>{formatearFecha(factura.fecha)}</td>
                      <td>
                        <div className="factura-concepto">
                          {factura.concepto}
                          {factura.proveedor && (
                            <small className="text-muted d-block">
                              Proveedor: {factura.proveedor}
                            </small>
                          )}
                          {factura.numeroFactura && (
                            <small className="text-muted d-block">
                              N° Factura: {factura.numeroFactura}
                            </small>
                          )}
                        </div>
                      </td>
                      <td className="text-end fw-bold">{formatearMoneda(factura.monto)}</td>
                      <td className="text-end">{formatearMoneda(factura.abono)}</td>
                      <td className="text-end fw-bold">
                        {formatearMoneda(factura.saldo)}
                      </td>
                      <td className="text-center">
                        {factura.saldo === 0 ? (
                          <Badge bg="success" pill>Pagada</Badge>
                        ) : factura.abono > 0 ? (
                          <Badge bg="warning" text="dark" pill>Parcial</Badge>
                        ) : (
                          <Badge bg="danger" pill>Pendiente</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        <Button 
                          variant="outline-success"
                          size="sm"
                          disabled={factura.saldo === 0}
                          onClick={() => abrirModalAbono(factura)}
                        >
                          <FaMoneyBillWave className="me-1" /> Abonar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
        <Card.Footer className="bg-light">
          <Row className="align-items-center">
            <Col>
              <small className="text-muted">
                Total de facturas: {facturasFiltradas.length}
              </small>
            </Col>
            <Col className="text-end">
              <small className="text-muted">
                Saldo total: {formatearMoneda(
                  facturasFiltradas.reduce((total, factura) => total + factura.saldo, 0)
                )}
              </small>
            </Col>
          </Row>
        </Card.Footer>
      </Card>

      {/* Modal de Abono */}
      <Modal show={showAbonoModal} onHide={() => setShowAbonoModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Registrar Abono</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentFactura && (
            <>
              <div className="mb-3">
                <h6>Detalles de la Factura:</h6>
                <p className="mb-1">
                  <strong>Concepto:</strong> {currentFactura.concepto}
                </p>
                <p className="mb-1">
                  <strong>Fecha:</strong> {formatearFecha(currentFactura.fecha)}
                </p>
                <p className="mb-1">
                  <strong>Monto Total:</strong> {formatearMoneda(currentFactura.monto)}
                </p>
                <p className="mb-1">
                  <strong>Abono Actual:</strong> {formatearMoneda(currentFactura.abono)}
                </p>
                <p className="mb-0">
                  <strong>Saldo Pendiente:</strong> {formatearMoneda(currentFactura.saldo)}
                </p>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Monto a Abonar</Form.Label>
                <Form.Control
                  type="number"
                  placeholder="Ingrese el monto"
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  isInvalid={!!errorAbono}
                  min="0.01"
                  step="0.01"
                  max={currentFactura.saldo}
                />
                <Form.Control.Feedback type="invalid">
                  {errorAbono}
                </Form.Control.Feedback>
                
                <div className="mt-3 d-flex justify-content-between">
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setMontoAbono((currentFactura.saldo / 2).toString())}
                  >
                    50%
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => setMontoAbono(currentFactura.saldo.toString())}
                  >
                    100%
                  </Button>
                </div>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAbonoModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={registrarAbono}
            disabled={isLoading}
          >
            {isLoading ? 'Registrando...' : 'Registrar Abono'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default FacturasPendientes; 