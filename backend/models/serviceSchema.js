const { mongoose } = require('../db_connect');

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: String,
  duration: {
    type: Number, // в минутах
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  employeeIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
}, {
  timestamps: true
});

const Service = mongoose.model('Service', ServiceSchema);
module.exports = { Service };
