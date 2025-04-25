import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Form, Row, Col, Card, Modal } from 'react-bootstrap';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaPlus, FaPercentage } from 'react-icons/fa';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ListaPrecios = () => {
  const [listaPrecios, setListaPrecios] = useState([]);
  const [productos, setProductos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [precioEditando, setPrecioEditando] = useState(null);
  const [mostrarModalAjuste, setMostrarModalAjuste] = useState(false);
  const [ajustePorcentaje, setAjustePorcentaje] = useState(0);
  const [tiposPrecioSeleccionados, setTiposPrecioSeleccionados] = useState({
    precio1: true,
    precio2: true,
    precio3: true,
    precioMayorista: true
  });
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    producto: '',
    precio1: 0,
    precio2: 0,
    precio3: 0,
    precioMayorista: 0,
    descripcion: ''
  });

  useEffect(() => {
    cargarListaPrecios();
    cargarProductos();
  }, []);

  const cargarListaPrecios = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/listaprecios`);
      setListaPrecios(response.data);
    } catch (error) {
      console.error('Error al cargar lista de precios:', error);
      toast.error('Error al cargar la lista de precios');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarProductos = async () => {
    try {
      const response = await axios.get(`${API_URL}/productos`);
      // Manejar respuesta paginada o directa
      const productosData = response.data.productos || response.data;
      setProductos(productosData);
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast.error('Error al cargar los productos');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name.startsWith('precio') ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const response = await axios.post(`${API_URL}/listaprecios`, formData);
      
      if (precioEditando) {
        toast.success('Precios actualizados correctamente');
      } else {
        toast.success('Lista de precios creada correctamente');
      }
      
      cargarListaPrecios();
      cerrarFormulario();
    } catch (error) {
      console.error('Error al guardar lista de precios:', error);
      toast.error('Error al guardar la lista de precios');
    } finally {
      setIsLoading(false);
    }
  };

  const abrirEditar = (precio) => {
    setPrecioEditando(precio);
    setFormData({
      producto: precio.producto._id,
      precio1: precio.precio1,
      precio2: precio.precio2,
      precio3: precio.precio3,
      precioMayorista: precio.precioMayorista,
      descripcion: precio.descripcion
    });
    setMostrarFormulario(true);
  };

  const abrirNuevo = () => {
    setPrecioEditando(null);
    setFormData({
      producto: '',
      precio1: 0,
      precio2: 0,
      precio3: 0,
      precioMayorista: 0,
      descripcion: ''
    });
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setPrecioEditando(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta lista de precios?')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/listaprecios/${id}`);
      toast.success('Lista de precios eliminada correctamente');
      cargarListaPrecios();
    } catch (error) {
      console.error('Error al eliminar lista de precios:', error);
      toast.error('Error al eliminar la lista de precios');
    }
  };

  const handleAjusteMasivo = async () => {
    try {
      if (isNaN(ajustePorcentaje) || ajustePorcentaje === 0) {
        toast.error('Ingrese un porcentaje válido');
        return;
      }

      const tiposPrecio = Object.entries(tiposPrecioSeleccionados)
        .filter(([_, selected]) => selected)
        .map(([tipo]) => tipo);
      
      if (tiposPrecio.length === 0) {
        toast.error('Seleccione al menos un tipo de precio');
        return;
      }

      setIsLoading(true);
      await axios.post(`${API_URL}/listaprecios/actualizar-masivo`, {
        porcentaje: ajustePorcentaje,
        tiposPrecio
      });

      toast.success(`Precios actualizados con un ${ajustePorcentaje}% de ajuste`);
      setMostrarModalAjuste(false);
      setAjustePorcentaje(0);
      cargarListaPrecios();
    } catch (error) {
      console.error('Error al ajustar precios:', error);
      toast.error('Error al ajustar los precios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTiposPrecioChange = (e) => {
    const { name, checked } = e.target;
    setTiposPrecioSeleccionados({
      ...tiposPrecioSeleccionados,
      [name]: checked
    });
  };

  const filtrarListaPrecios = () => {
    if (!filtro) return listaPrecios;
    
    return listaPrecios.filter(item => 
      item.nombreProducto.toLowerCase().includes(filtro.toLowerCase()) ||
      item.codigoProducto.toLowerCase().includes(filtro.toLowerCase())
    );
  };

  const listaFiltrada = filtrarListaPrecios();

  return (
    <Container>
      <h2 className="my-4">Gestión de Lista de Precios</h2>
      
      <Row className="mb-3">
        <Col md={6}>
          <Button variant="success" className="mb-3 me-2" onClick={abrirNuevo}>
            <FaPlus className="me-2" /> Nuevo Precio
          </Button>
          <Button variant="info" className="mb-3" onClick={() => setMostrarModalAjuste(true)}>
            <FaPercentage className="me-2" /> Ajuste Masivo
          </Button>
        </Col>
        <Col md={6}>
          <Form.Control
            type="text"
            placeholder="Buscar por nombre o código"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        </Col>
      </Row>
      
      {isLoading ? (
        <p>Cargando...</p>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th>Precio 1</th>
              <th>Precio 2</th>
              <th>Precio 3</th>
              <th>Precio Mayorista</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.map(item => (
              <tr key={item._id}>
                <td>{item.nombreProducto}</td>
                <td>{item.codigoProducto}</td>
                <td>${item.precio1.toFixed(2)}</td>
                <td>${item.precio2.toFixed(2)}</td>
                <td>${item.precio3.toFixed(2)}</td>
                <td>${item.precioMayorista.toFixed(2)}</td>
                <td>
                  <Button variant="warning" size="sm" className="me-2" onClick={() => abrirEditar(item)}>
                    <FaEdit />
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(item._id)}>
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      
      {/* Modal para crear/editar lista de precios */}
      <Modal show={mostrarFormulario} onHide={cerrarFormulario} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{precioEditando ? 'Editar Precios' : 'Nuevo Precio'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Producto</Form.Label>
              <Form.Select 
                name="producto" 
                value={formData.producto} 
                onChange={handleChange}
                disabled={!!precioEditando}
                required
              >
                <option value="">Seleccione un producto</option>
                {productos.map(p => (
                  <option key={p._id} value={p._id}>
                    {p.nombre} - {p.codigo}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio 1</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="precio1" 
                    value={formData.precio1} 
                    onChange={handleChange}
                    step="0.01"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio 2</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="precio2" 
                    value={formData.precio2} 
                    onChange={handleChange}
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio 3</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="precio3" 
                    value={formData.precio3} 
                    onChange={handleChange}
                    step="0.01"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Precio Mayorista</Form.Label>
                  <Form.Control 
                    type="number" 
                    name="precioMayorista" 
                    value={formData.precioMayorista} 
                    onChange={handleChange}
                    step="0.01"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Descripción</Form.Label>
              <Form.Control 
                as="textarea" 
                name="descripcion" 
                value={formData.descripcion} 
                onChange={handleChange}
                rows={3}
              />
            </Form.Group>
            
            <Button variant="primary" type="submit" disabled={isLoading}>
              {isLoading ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button variant="secondary" onClick={cerrarFormulario} className="ms-2">
              Cancelar
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Modal para ajuste masivo de precios */}
      <Modal show={mostrarModalAjuste} onHide={() => setMostrarModalAjuste(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Ajuste Masivo de Precios</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Porcentaje de Ajuste (%)</Form.Label>
            <Form.Control 
              type="number" 
              value={ajustePorcentaje} 
              onChange={(e) => setAjustePorcentaje(parseFloat(e.target.value))}
              step="0.01"
              required
            />
            <Form.Text>
              Valor positivo para aumento, negativo para descuento
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Aplicar a:</Form.Label>
            <div>
              <Form.Check 
                type="checkbox" 
                label="Precio 1" 
                name="precio1"
                checked={tiposPrecioSeleccionados.precio1}
                onChange={handleTiposPrecioChange}
                inline
              />
              <Form.Check 
                type="checkbox" 
                label="Precio 2" 
                name="precio2"
                checked={tiposPrecioSeleccionados.precio2}
                onChange={handleTiposPrecioChange}
                inline
              />
              <Form.Check 
                type="checkbox" 
                label="Precio 3" 
                name="precio3"
                checked={tiposPrecioSeleccionados.precio3}
                onChange={handleTiposPrecioChange}
                inline
              />
              <Form.Check 
                type="checkbox" 
                label="Precio Mayorista" 
                name="precioMayorista"
                checked={tiposPrecioSeleccionados.precioMayorista}
                onChange={handleTiposPrecioChange}
                inline
              />
            </div>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMostrarModalAjuste(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAjusteMasivo} disabled={isLoading}>
            {isLoading ? 'Aplicando...' : 'Aplicar Ajuste'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default ListaPrecios; 