const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ventaSchema = new mongoose.Schema({
  fecha: {
    type: Date,
    default:  () => moment().utc().toDate(), // Usar fecha UTC
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: true
  },
  productos: [{
    producto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    cantidad: {
      type: Number,
      required: true
    },
    precioUnitario: {
      type: Number,
      required: true
    },
  gananciaUnitaria: {
    type: Number,
    required: true
  },
  gananciaTotal: {
    type: Number,
    required: true
  }
  }],
  total: {
    type: Number,
    required: true
  },
  tipoPago: {
    type: String,
    enum: ['contado', 'credito'],
    required: true
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'transferencia', 'tarjeta'],
    required: true
  },
  banco: {
    type: String,
    required: function() {
      return this.metodoPago === 'transferencia';
    }
  },
  montoAbonado: {
    type: Number,
    default: 0
  },
  saldoPendiente: {
    type: Number,
    default: 0
  },
  nrFactura: {
    type: String,
    required: true
  }
});

// Configurar paginación
ventaSchema.plugin(mongoosePaginate);

const Venta = mongoose.model('Venta', ventaSchema);

module.exports = Venta;