// routes/appointmentRoutes.js
const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments, updateAppointment, cancelAppointment } = require('../services/appointmentService');
const authMiddleware = require('../middlewares/authMiddleware');
const { MESSAGE } = require('../const');
const Slot = require('../models/slotSchema');
const {Service} = require('../models/serviceSchema');
const Appointment = require('../models/appointmentSchema').Appointment;
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

// Создание записи
router.post('/', authMiddleware, async (req, res) => {
  try {
    const clientId = req.user._id;
    const { employeeId, serviceId, date } = req.body;

    const slotDate = date.split('T')[0];
    const startTime = date.split('T')[1].slice(0, 5);

    const service = await Service.findById(serviceId);
    const duration = service?.duration || 30;

    const start = new Date(date);
    const end = addMinutes(start, duration);

    const bookedTimes = [];
    let current = new Date(start);

    while (current < end) {
      bookedTimes.push(format(current, 'HH:mm'));
      current = addMinutes(current, 30);
    }

    const newAppointment = await createAppointment({
      clientId,
      employeeId,
      serviceId,
      date,
      slotTimes: bookedTimes
    });

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

// Отмена записи
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).send({ error: 'Запись не найдена' });

    const slotDate = format(appointment.date, 'yyyy-MM-dd');
    const bookedTimes = appointment.slotTimes || [];

    await Slot.updateMany(
      {
        employeeId: appointment.employeeId,
        date: slotDate,
        time: { $in: bookedTimes }
      },
      { isBooked: false }
    );

    const cancelled = await cancelAppointment(req.params.id);
    res.send(cancelled);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
