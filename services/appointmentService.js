const { Appointment } = require('../models/appointmentSchema');

async function createAppointment(data) {
  const appointment = new Appointment(data);
  return await appointment.save();
}

async function getAppointments(filter = {}) {
  return await Appointment.find(filter).populate('clientId').populate('employeeId');
}

async function updateAppointment(id, update) {
  return await Appointment.findByIdAndUpdate(id, update, { new: true });
}

async function cancelAppointment(id) {
  return await Appointment.findByIdAndUpdate(id, { status: 'cancelled' }, { new: true });
}

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment
};
