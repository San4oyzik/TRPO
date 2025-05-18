// routes/availabilityRoutes.js
const express = require('express');
const router = express.Router();
const { Appointment } = require('../models/appointmentSchema');
const { Service } = require('../models/serviceSchema');
const authMiddleware = require('../middlewares/authMiddleware');
const { addMinutes, format } = require('date-fns');

// Условный график работы мастера: с 10:00 до 18:00
const START_HOUR = 10;
const END_HOUR = 18;

router.get('/', authMiddleware, async (req, res) => {
  const { employeeId, serviceId } = req.query;

  if (!employeeId || !serviceId) {
    return res.status(400).json({ error: 'Необходимы employeeId и serviceId' });
  }

  try {
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Услуга не найдена' });

    const duration = service.duration;
    const daysAhead = 7;
    const today = new Date();
    const availableDates = [];
    const slots = {};

    for (let i = 0; i < daysAhead; i++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);
      const dateKey = format(currentDate, 'yyyy-MM-dd');

      const start = new Date(currentDate);
      start.setHours(START_HOUR, 0, 0, 0);

      const end = new Date(currentDate);
      end.setHours(END_HOUR, 0, 0, 0);

      const appointments = await Appointment.find({
        employeeId,
        date: {
          $gte: new Date(start.toISOString()),
          $lt: new Date(end.toISOString())
        }
      });

      const takenSlots = appointments.map(a => format(new Date(a.date), 'HH:mm'));

      const currentSlots = [];
      for (let slot = new Date(start); slot < end; slot = addMinutes(slot, duration)) {
        const timeStr = format(slot, 'HH:mm');
        if (!takenSlots.includes(timeStr)) {
          currentSlots.push(timeStr);
        }
      }

      if (currentSlots.length > 0) {
        availableDates.push(dateKey);
        slots[dateKey] = currentSlots;
      }
    }

    res.json({ availableDates, slots });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
