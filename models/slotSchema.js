// models/slotSchema.js
const { mongoose } = require('../db_connect');

const slotSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // '2025-05-21'
    required: true
  },
  time: {
    type: String, // '14:00'
    required: true
  },
  isBooked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Slot = mongoose.model('Slot', slotSchema);
module.exports = Slot;
