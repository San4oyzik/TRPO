const express = require('express');
const router = express.Router();
const { createAppointment, getAppointments, updateAppointment, cancelAppointment } = require('../services/appointmentService');
const authMiddleware = require('../middlewares/authMiddleware');
const { MESSAGE } = require('../const');

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
    const clientId = req.user._id; // из токена
    const { employeeId, service, date } = req.body;

    const newAppointment = await createAppointment({
      clientId,
      employeeId,
      service,
      date
    });

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
    const cancelled = await cancelAppointment(req.params.id);
    if (!cancelled) return res.status(404).send({ error: 'Запись не найдена' });
    res.send(cancelled);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
