const { Appointment } = require('../models/appointmentSchema');
const { Service } = require('../models/serviceSchema');
const mongoose = require('mongoose');

const createAppointment = async ({ clientId, employeeId, serviceId, date }) => {
  const service = await Service.findById(serviceId);
  if (!service) throw new Error('Услуга не найдена');

  const start = new Date(date);
  const end = new Date(start.getTime() + service.duration * 60000);

  const conflict = await Appointment.findOne({
    employeeId,
    status: { $ne: 'cancelled' },
    date: {
      $lt: end,
      $gte: new Date(start.getTime() - service.duration * 60000),
    }
  });

  if (conflict) {
    throw new Error('Слот уже занят другим клиентом');
  }

  return Appointment.create({
    clientId,
    employeeId,
    serviceId,
    date,
  });
};

async function getAppointments(filter = {}) {
  if (filter.employeeId) {
    filter.employeeId = new mongoose.Types.ObjectId(filter.employeeId);
  }

  const appointments = await Appointment.find(filter)
    .populate('clientId', 'fullName')
    .populate('employeeId', 'fullName')
    .populate('serviceId', 'name duration price');

  const now = new Date();

  const updates = appointments.map(async (appt) => {
    const endTime = new Date(new Date(appt.date).getTime() + (appt.serviceId?.duration || 60) * 60000);

    if (appt.status === 'active' && endTime < now) {
      appt.status = 'completed';
      await appt.save();
    }
  });

  await Promise.all(updates);

  return appointments;
}

async function updateAppointment(id, update) {
  return await Appointment.findByIdAndUpdate(id, update, { new: true });
}

async function cancelAppointment(id, userId) {
  const appointment = await Appointment.findById(id).populate('serviceId');
  if (!appointment) throw new Error('Запись не найдена');

  const duration = appointment.serviceId?.duration || 60;
  const start = new Date(appointment.date);

  // Вычисляем все слоты, попавшие в интервал записи
  const end = new Date(start.getTime() + duration * 60000);
  const slotFilter = {
    employeeId: appointment.employeeId,
    date: start.toISOString().split('T')[0],
    time: { $gte: start.toTimeString().slice(0, 5), $lt: end.toTimeString().slice(0, 5) }
  };

  // Освобождаем занятые слоты
  await Slot.updateMany(slotFilter, { isBooked: false });

  // Удаляем запись
  await Appointment.findByIdAndDelete(id);
  return { success: true };
}

async function isSlotAvailable(employeeId, date, durationMinutes) {
  const start = new Date(date);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const conflict = await Appointment.findOne({
    employeeId,
    status: { $ne: 'cancelled' },
    date: {
      $lt: end,
      $gte: start,
    }
  });

  return !conflict;
}

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment,
  isSlotAvailable
};
