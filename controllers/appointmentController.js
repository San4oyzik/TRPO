const Appointment = require('../models/appointmentSchema');
const Service = require('../models/serviceSchema');

// Создание новой записи
const createAppointment = async (req, res) => {
  try {
    const { clientId, employeeId, services: serviceIds, date } = req.body;

    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: 'Необходимо указать хотя бы одну услугу' });
    }

    const servicesData = await Service.find({ _id: { $in: serviceIds } });
    if (servicesData.length !== serviceIds.length) {
      return res.status(400).json({ error: 'Одна или несколько услуг не найдены' });
    }

    const services = servicesData.map(s => ({
      serviceId: s._id,
      duration: s.duration,
      price: s.price
    }));
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);

    const appointment = new Appointment({
      clientId,
      employeeId,
      services,
      totalDuration,
      totalPrice,
      date
    });

    await appointment.save();

    await appointment
      .populate('clientId', 'fullName email')
      .populate('employeeId', 'fullName email')
      .populate('services.serviceId', 'name duration price')
      .execPopulate();

    res.status(201).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при создании записи', details: err.message });
  }
};

// Получение всех записей
const getAppointments = async (req, res) => {
  try {
    const filter = {};
    if (req.query.clientId)   filter.clientId = req.query.clientId;
    if (req.query.employeeId) filter.employeeId = req.query.employeeId;

    const appointments = await Appointment
      .find(filter)
      .populate('clientId', 'fullName email')
      .populate('employeeId', 'fullName email')
      .populate('services.serviceId', 'name duration price')
      .exec();

    res.status(200).json(appointments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при получении записей', details: err.message });
  }
};

// Обновление записи
const updateAppointment = async (req, res) => {
  try {
    const updateData = {};

    if (req.body.date) {
      updateData.date = req.body.date;
    }

    if (req.body.status) {
      updateData.status = req.body.status; // ← добавь эту строку, если её ещё нет
    }

    if (Array.isArray(req.body.services)) {
      const servicesData = await Service.find({ _id: { $in: req.body.services } });
      if (servicesData.length !== req.body.services.length) {
        return res.status(400).json({ error: 'Одна или несколько услуг не найдены' });
      }

      const services = servicesData.map(s => ({
        serviceId: s._id,
        duration: s.duration,
        price: s.price
      }));

      updateData.services = services;
      updateData.totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
      updateData.totalPrice = services.reduce((sum, s) => sum + s.price, 0);
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
      .populate('clientId', 'fullName email')
      .populate('employeeId', 'fullName email')
      .populate('services.serviceId', 'name duration price');

    if (!appointment) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }

    res.status(200).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при обновлении записи', details: err.message });
  }
};

// Отмена записи
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!appointment) {
      return res.status(404).json({ error: 'Запись не найдена' });
    }
    res.status(200).json(appointment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Ошибка при отмене записи', details: err.message });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  updateAppointment,
  cancelAppointment
};
