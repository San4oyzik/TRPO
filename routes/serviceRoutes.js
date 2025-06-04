const express = require('express');
const router = express.Router();
const {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService
} = require('../services/serviceService');
const authMiddleware = require('../middlewares/authMiddleware');

// 🔐 Доступ можно ограничить по ролям если нужно

router.get('/', async (req, res) => {
  try {
    const services = await getAllServices();
    res.send(services);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const service = await getServiceById(req.params.id);
    if (!service) return res.status(404).send({ error: 'Услуга не найдена' });
    res.send(service);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const newService = await createService(req.body);
    res.status(201).send(newService);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const updated = await updateService(req.params.id, req.body);
    if (!updated) return res.status(404).send({ error: 'Услуга не найдена' });
    res.send(updated);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const deleted = await deleteService(req.params.id);
    if (!deleted) return res.status(404).send({ error: 'Услуга не найдена' });
    res.send(deleted);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
