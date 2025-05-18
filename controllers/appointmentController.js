const Appointment = require('../models/appointmentSchema');

// Создание новой записи
const createAppointment = async (req, res) => {
  try {
    const { clientId, employeeId, service, date } = req.body;

    const appointment = new Appointment({
      clientId,
      employeeId,
      service,
      date
    });

    await appointment.save();

    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при создании записи', details: err.message });
  }
};

// Получение всех записей (по фильтру)
const getAppointments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.clientId) filter.clientId = req.query.clientId;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const appointments = await Appointment.find(filter).populate('clientId').populate('employeeId');
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при получении записей', details: err.message });
  }
};

// Обновление записи
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!appointment) return res.status(404).json({ error: 'Запись не найдена' });

    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при обновлении записи', details: err.message });
  }
};

// Отмена записи (удаление или смена статуса)
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: 'cancelled' }, { new: true });
    if (!appointment) return res.status(404).json({ error: 'Запись не найдена' });

    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ error: 'Ошибка при отмене записи', details: err.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment
};
