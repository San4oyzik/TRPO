// routes/slotRoutes.js
const express = require('express');
const router = express.Router();
const Slot = require('../models/slotSchema');
const authMiddleware = require('../middlewares/authMiddleware');
const { addMinutes, format } = require('date-fns');

// 🔄 Генерация слотов
router.post('/generate', authMiddleware, async (req, res) => {
  const { employeeId, date, startTime, endTime } = req.body;
  const roles = req.user.roles || [];

  if (!roles.includes('employee') && !roles.includes('admin')) {
    return res.status(403).json({ error: 'Недостаточно прав для генерации слотов' });
  }

  if (!employeeId || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Нужны employeeId, date, startTime, endTime' });
  }

  try {
    const day = new Date(date);
    const timeStart = new Date(`${date}T${startTime}`);
    const timeEnd = new Date(`${date}T${endTime}`);
    const STEP_MINUTES = 30;

    while (timeStart < timeEnd) {
      const dateStr = format(day, 'yyyy-MM-dd');
      const timeStr = format(timeStart, 'HH:mm');

      const existing = await Slot.findOne({ employeeId, date: dateStr, time: timeStr });
      if (!existing) {
        await Slot.create({ employeeId, date: dateStr, time: timeStr });
      }

      timeStart.setMinutes(timeStart.getMinutes() + STEP_MINUTES);
    }

    res.json({ message: 'Слоты успешно созданы' });
  } catch (err) {
    console.error('Ошибка генерации:', err);
    res.status(500).json({ error: 'Ошибка генерации слотов' });
  }
});

// ✅ Получение всех слотов всех сотрудников (новый эндпоинт)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const slots = await Slot.find({});
    res.json(slots);
  } catch (err) {
    console.error('Ошибка при получении всех слотов:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// 🔍 Получение доступных слотов по employeeId
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

// Получение слотов конкретного сотрудника
router.get('/', authMiddleware, async (req, res) => {
  const { employeeId } = req.query;

  if (!employeeId) {
    return res.status(400).json({ error: 'Не передан employeeId' });
  }

  try {
    const slots = await Slot.find({ employeeId });
    res.json(slots);
  } catch (err) {
    console.error('Ошибка при получении слотов:', err);
    res.status(500).json({ error: 'Ошибка при получении слотов' });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { employeeId, date, time } = req.body;

    if (!employeeId || !date || !time) {
      return res.status(400).json({ error: 'employeeId, date и time обязательны' });
    }

    const existing = await Slot.findOne({ employeeId, date, time });
    if (existing) {
      return res.status(409).json({ error: 'Такой слот уже существует' });
    }

    const newSlot = await Slot.create({ employeeId, date, time });
    res.status(201).json(newSlot);
  } catch (err) {
    console.error('Ошибка при создании слота:', err);
    res.status(500).json({ error: 'Ошибка при создании слота' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const slot = await Slot.findById(id);
    if (!slot) {
      return res.status(404).json({ error: 'Слот не найден' });
    }

    await Slot.findByIdAndDelete(id);
    res.json({ message: 'Слот удалён' });
  } catch (err) {
    console.error('Ошибка при удалении слота:', err);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
