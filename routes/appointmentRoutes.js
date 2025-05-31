const express = require('express');
const router = express.Router();
const {
  createAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment,
  updateStatus
} = require('../services/appointmentService');
const authMiddleware = require('../middlewares/authMiddleware');
const { MESSAGE } = require('../const');
const Slot = require('../models/slotSchema');
const { Service } = require('../models/serviceSchema');
const { Appointment } = require('../models/appointmentSchema');
const { addMinutes, format } = require('date-fns');

// Получение всех записей или по фильтру (клиент или сотрудник)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { clientId, employeeId } = req.query;
    const filter = {};
    if (clientId) filter.clientId = clientId;
    if (employeeId) filter.employeeId = employeeId;

    const appointments = await getAppointments(filter);
    res.send(appointments);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

// Создание записи на несколько услуг (в том числе другого человека)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const clientId = req.user._id;
    const { employeeId, services: serviceIds, date, externalName, externalPhone } = req.body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).send({ error: 'Нужно указать хотя бы одну услугу' });
    }

    const servicesData = await Service.find({ _id: { $in: serviceIds } });
    if (servicesData.length !== serviceIds.length) {
      return res.status(400).send({ error: 'Одна или несколько услуг не найдены' });
    }

    let totalDuration = 0;
    servicesData.forEach(s => {
      totalDuration += s.duration;
    });

    const start = new Date(date);
    const end = addMinutes(start, totalDuration);

    const bookedTimes = [];
    let current = new Date(start);
    while (current < end) {
      bookedTimes.push(format(current, 'HH:mm'));
      current = addMinutes(current, 30);
    }

    const newAppointment = await createAppointment({
      clientId,
      employeeId,
      services: serviceIds,
      date,
      externalName,
      externalPhone
    });

    const slotDate = format(start, 'yyyy-MM-dd');
    const updateResult = await Slot.updateMany(
      {
        employeeId,
        date: slotDate,
        time: { $in: bookedTimes }
      },
      { isBooked: true }
    );
    if (updateResult.modifiedCount === 0) {
      console.warn('Слоты не найдены или не обновлены:', { employeeId, slotDate, bookedTimes });
    }

    res.status(201).send(newAppointment);
  } catch (e) {
    console.error('Ошибка при создании записи:', e.message);
    res.status(500).send({ error: e.message });
  }
});

// Обновление записи
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await updateAppointment(req.params.id, req.body);
    if (!updated) return res.status(404).send({ error: 'Запись не найдена' });
    res.send(updated);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

// Обновление статуса записи
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const result = await updateStatus(req.params.id, req.body.status);
    res.send(result);
  } catch (e) {
    console.error('Ошибка при обновлении статуса записи:', e.message);
    res.status(500).send({ error: e.message });
  }
});

// Отмена записи и освобождение слотов
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('services.serviceId');
    if (!appointment) return res.status(404).send({ error: 'Запись не найдена' });

    const start = new Date(appointment.date);
    const totalDuration = appointment.totalDuration || appointment.services.reduce((sum, s) => sum + s.duration, 0);
    const end = addMinutes(start, totalDuration);

    const timesToFree = [];
    let current = new Date(start);
    while (current < end) {
      timesToFree.push(format(current, 'HH:mm'));
      current = addMinutes(current, 30);
    }

    const slotDate = format(start, 'yyyy-MM-dd');
    await Slot.updateMany(
      {
        employeeId: appointment.employeeId,
        date: slotDate,
        time: { $in: timesToFree }
      },
      { isBooked: false }
    );

    await cancelAppointment(req.params.id);
    res.send({ message: MESSAGE.APPOINTMENT_CANCELLED });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
