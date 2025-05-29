// services/appointmentService.js
const { Appointment } = require('../models/appointmentSchema');
const { Service } = require('../models/serviceSchema');
const Slot = require('../models/slotSchema');
const { addMinutes, format } = require('date-fns');

/**
 * Create a new appointment with multiple services.
 * @param {{ clientId, employeeId, services: ObjectId[], date: string }} data
 */
async function createAppointment({ clientId, employeeId, services: serviceIds, date }) {
  if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
    throw new Error('Нужно указать хотя бы одну услугу');
  }

  // Load selected services from DB
  const servicesData = await Service.find({ _id: { $in: serviceIds } });
  if (servicesData.length !== serviceIds.length) {
    throw new Error('Одна или несколько услуг не найдены');
  }

  // Build embedded services array and compute totals
  const services = servicesData.map(s => ({
    serviceId: s._id,
    duration: s.duration,
    price: s.price
  }));
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
  const totalPrice    = services.reduce((sum, s) => sum + s.price, 0);

  // Check for scheduling conflicts across the whole combined duration
  const start = new Date(date);
  const end   = addMinutes(start, totalDuration);
  const conflict = await Appointment.findOne({
    employeeId,
    status: { $ne: 'cancelled' },
    date: { $lt: end, $gte: start }
  });
  if (conflict) {
    throw new Error('Слот уже занят другим клиентом');
  }

  // Create appointment document
  const appt = await Appointment.create({
    clientId,
    employeeId,
    services,
    totalDuration,
    totalPrice,
    date
  });

  // Mark the corresponding half-hour slots as booked
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

  // Populate and return enriched appointment
  await appt.populate('clientId', 'fullName email');
  await appt.populate('employeeId', 'fullName email');
  await appt.populate({ path: 'services.serviceId', select: 'name duration price' });
  return appt;
}

/**
 * Retrieve appointments, optionally filtered by clientId or employeeId.
 * @param {{ clientId?: string, employeeId?: string }} filter
 */
async function getAppointments(filter = {}) {
  const q = {};
  if (filter.clientId)   q.clientId   = filter.clientId;
  if (filter.employeeId) q.employeeId = filter.employeeId;

  const appointments = await Appointment
    .find(q)
    .populate('clientId', 'fullName')
    .populate('employeeId', 'fullName')
    .populate({ path: 'services.serviceId', select: 'name duration price' })
    .exec();

  // Auto-mark past appointments as completed
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
 * Update an appointment's date and/or services.
 * @param {string} id
 * @param {{ date?: string, services?: ObjectId[] }} data
 */
async function updateAppointment(id, { date, services: serviceIds }) {
  const update = {};
  if (date) update.date = date;

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
    update.services      = services;
    update.totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    update.totalPrice    = services.reduce((sum, s) => sum + s.price, 0);
  }

  return Appointment
    .findByIdAndUpdate(id, update, { new: true })
    .populate('clientId', 'fullName')
    .populate('employeeId', 'fullName')
    .populate({ path: 'services.serviceId', select: 'name duration price' })
    .exec();
}

/**
 * Cancel an appointment: free its slots and set status to 'cancelled'.
 * @param {string} id
 */
async function cancelAppointment(id) {
  const appt = await Appointment
    .findById(id)
    .populate({ path: 'services.serviceId', select: 'duration' });

  if (!appt) throw new Error('Запись не найдена');

  // Calculate occupied time range
  const start = new Date(appt.date);
  const end   = addMinutes(start, appt.totalDuration);

  // Free half-hour slots
  const slotDate = format(start, 'yyyy-MM-dd');
  let cursor = new Date(start);
  const timesToFree = [];
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
 * Check if a given time range is free for booking.
 * @param {string} employeeId
 * @param {string} dateTime ISO string start
 * @param {number} durationMinutes
 */
async function isSlotAvailable(employeeId, dateTime, durationMinutes) {
  const start = new Date(dateTime);
  const end   = addMinutes(start, durationMinutes);

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
