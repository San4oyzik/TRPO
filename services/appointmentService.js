const { Appointment } = require('../models/appointmentSchema');

const createAppointment = ({ clientId, employeeId, serviceId, date, slotTimes }) => {
  return Appointment.create({
    clientId,
    employeeId,
    serviceId,
    date,
    slotTimes
  });
};


const mongoose = require('mongoose');

async function getAppointments(filter = {}) {
  if (filter.employeeId) {
    filter.employeeId = new mongoose.Types.ObjectId(filter.employeeId);
  }

  return await Appointment.find(filter)
    .populate('clientId', 'fullName')
    .populate('employeeId', 'fullName')
    .populate('serviceId', 'name duration price');
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
