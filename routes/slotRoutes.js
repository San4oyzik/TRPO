// routes/slotRoutes.js
const express = require('express');
const router = express.Router();
const Slot = require('../models/slotSchema');
const authMiddleware = require('../middlewares/authMiddleware');
const { addMinutes, format } = require('date-fns');

// Генерация слотов (например: шаг 30 минут с 10:00 до 18:00)
router.post('/generate', authMiddleware, async (req, res) => {
  const { employeeId } = req.body;
  const roles = req.user.roles || [];

  if (!roles.includes('employee') && !roles.includes('admin')) {
    return res.status(403).json({ error: 'Недостаточно прав для генерации слотов' });
  }

  const START_HOUR = 10;
  const END_HOUR = 18;
  const STEP_MINUTES = 30;
  const DAYS_AHEAD = 7;

  try {
    const today = new Date();

    for (let i = 0; i < DAYS_AHEAD; i++) {
      const day = new Date(today);
      day.setDate(today.getDate() + i);
      const dateStr = format(day, 'yyyy-MM-dd');

      let time = new Date(day);
      time.setHours(START_HOUR, 0, 0, 0);
      const endTime = new Date(day);
      endTime.setHours(END_HOUR, 0, 0, 0);

      while (time < endTime) {
        const timeStr = format(time, 'HH:mm');

        const existing = await Slot.findOne({ employeeId, date: dateStr, time: timeStr });
        if (!existing) {
          await Slot.create({ employeeId, date: dateStr, time: timeStr });
        }

        time = addMinutes(time, STEP_MINUTES);
      }
    }

    res.json({ message: 'Слоты успешно сгенерированы' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка генерации слотов' });
  }
});

// Получение доступности по слотам
router.get('/availability', authMiddleware, async (req, res) => {
  const { employeeId } = req.query;

  if (!employeeId) {
    return res.status(400).json({ error: 'Не передан employeeId' });
  }

  try {
    const slots = await Slot.find({ employeeId, isBooked: false });

    const grouped = {};
    const availableDates = new Set();

    slots.forEach(slot => {
      if (!grouped[slot.date]) grouped[slot.date] = [];
      grouped[slot.date].push(slot.time);
      availableDates.add(slot.date);
    });

    res.json({
      availableDates: Array.from(availableDates),
      slots: grouped
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка получения доступных слотов' });
  }
});

module.exports = router;
