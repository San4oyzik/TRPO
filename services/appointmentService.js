const { Appointment } = require('../models/appointmentSchema');
const { Service } = require('../models/serviceSchema');
const Slot = require('../models/slotSchema');
const { addMinutes, format } = require('date-fns');

/**
 * Create a new appointment with optional external client data
 */
async function createAppointment({ clientId, employeeId, services: serviceIds, date, externalName, externalPhone }) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw new Error('Нужно указать хотя бы одну услугу');
  }

  const servicesData = await Service.find({ _id: { $in: serviceIds } });
  if (servicesData.length !== serviceIds.length) {
    throw new Error('Одна или несколько услуг не найдены');
  }

  const services = servicesData.map(s => ({
    serviceId: s._id,
    duration: s.duration,
    price: s.price
  }));

  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

  const start = new Date(date);
  const end = addMinutes(start, totalDuration);

  const conflict = await Appointment.findOne({
    employeeId,
    status: { $ne: 'cancelled' },
    date: { $lt: end, $gte: start }
  });
  if (conflict) {
    throw new Error('Слот уже занят другим клиентом');
  }

  const appt = await Appointment.create({
    clientId,
    employeeId,
    services,
    totalDuration,
    totalPrice,
    date,
    ...(externalName && externalPhone ? { externalName, externalPhone } : {})
  });

  const slotDate = format(start, 'yyyy-MM-dd');
  let cursor = new Date(start);
  const bookedTimes = [];
  while (cursor < end) {
    bookedTimes.push(format(cursor, 'HH:mm'));
    cursor = addMinutes(cursor, 30);
  }
  await Slot.updateMany(
    { employeeId, date: slotDate, time: { $in: bookedTimes } },
    { isBooked: true }
  );

  await appt.populate('clientId', 'fullName email');
  await appt.populate('employeeId', 'fullName email');
  await appt.populate({ path: 'services.serviceId', select: 'name duration price' });
  return appt;
}

/**
 * Get appointments, auto-completing past ones
 */
async function getAppointments(filter = {}) {
  const q = {};
  if (filter.clientId)   q.clientId = filter.clientId;
  if (filter.employeeId) q.employeeId = filter.employeeId;

  const appointments = await Appointment
    .find(q)
    .populate('clientId', 'fullName email phone')
    .populate('employeeId', 'fullName')
    .populate({ path: 'services.serviceId', select: 'name duration price' });

  const now = new Date();
  await Promise.all(appointments.map(async appt => {
    const end = addMinutes(new Date(appt.date), appt.totalDuration);
    if (appt.status === 'active' && end < now) {
      appt.status = 'completed';
      await appt.save();
    }
  }));

  return appointments;
}

/**
 * Update appointment
 */
async function updateAppointment(id, { date, services: serviceIds, status }) {
  const update = {};
  if (date) update.date = date;
  if (status) update.status = status;

  if (Array.isArray(serviceIds)) {
    const servicesData = await Service.find({ _id: { $in: serviceIds } });
    if (servicesData.length !== serviceIds.length) {
      throw new Error('Одна или несколько услуг не найдены');
    }

    const services = servicesData.map(s => ({
      serviceId: s._id,
      duration: s.duration,
      price: s.price
    }));
    update.services = services;
    update.totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    update.totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  }

  return Appointment
    .findByIdAndUpdate(id, update, { new: true })
    .populate('clientId', 'fullName email phone')
    .populate('employeeId', 'fullName')
    .populate({ path: 'services.serviceId', select: 'name duration price' });
}

/**
 * Cancel appointment
 */
async function cancelAppointment(id) {
  const appt = await Appointment.findById(id).populate({ path: 'services.serviceId', select: 'duration' });
  if (!appt) throw new Error('Запись не найдена');

  const start = new Date(appt.date);
  const end = addMinutes(start, appt.totalDuration);
  const slotDate = format(start, 'yyyy-MM-dd');
  const timesToFree = [];

  let cursor = new Date(start);
  while (cursor < end) {
    timesToFree.push(format(cursor, 'HH:mm'));
    cursor = addMinutes(cursor, 30);
  }

  await Slot.updateMany(
    { employeeId: appt.employeeId, date: slotDate, time: { $in: timesToFree } },
    { isBooked: false }
  );

  appt.status = 'cancelled';
  await appt.save();
  return appt;
}

/**
 * Check availability
 */
async function isSlotAvailable(employeeId, dateTime, durationMinutes) {
  const start = new Date(dateTime);
  const end = addMinutes(start, durationMinutes);

  const conflict = await Appointment.findOne({
    employeeId,
    status: { $ne: 'cancelled' },
    date: { $lt: end, $gte: start }
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
