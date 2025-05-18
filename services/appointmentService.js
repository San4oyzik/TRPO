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


async function getAppointments(filter = {}) {
  return await Appointment.find(filter)
    .populate('clientId', 'username email')
    .populate('employeeId', 'username email')
    .populate('serviceId', 'name duration price'); // <— вот тут подтягиваем название, цену и т.д.
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
