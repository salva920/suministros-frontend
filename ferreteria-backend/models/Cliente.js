const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const clienteSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  telefono: {
    type: String,
    required: true,
    match: /^\+?58-?4(1[2-9]|2[0-9])-?\d{7}$/ // Mejor validación para teléfonos venezolanos
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // Validación básica de email
  },
  direccion: {
    type: String,
    trim: true
  },
  municipio: {
    type: String,
    required: true,
    trim: true
  },
  rif: {
    type: String,
    required: true,
    unique: true,
    match: /^[VEJG]-?\d{7,9}$/ // Regex mejorado para permitir guiones
  },
  categorias: [{
    type: String,
    enum: ['Alto Riesgo', 'Agente Retención'], // ENUM limitado
    default: [] // Valor por defecto faltante
  }],
  municipioColor: {
    type: String,
    default: '#ffffff',
    validate: {
      validator: function(v) {
        return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(v);
      },
      message: props => `${props.value} no es un color hexadecimal válido!`
    }
  },
  fechaRegistro: {
    type: Date,
    default: Date.now
  }
});

// Índices para búsquedas frecuentes
clienteSchema.index({ nombre: 1 });
clienteSchema.index({ rif: 1 });
clienteSchema.index({ municipio: 1 });

// Aplicar el plugin de paginación
clienteSchema.plugin(mongoosePaginate);

// Agregar transformación al schema para convertir _id a string
clienteSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function(doc, ret) {
    ret.id = ret._id.toString(); // Convertir _id a string y renombrarlo a id
    delete ret._id; // Eliminar el campo _id
  }
});

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;