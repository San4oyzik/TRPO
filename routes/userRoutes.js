const express = require('express');
const router = express.Router();
const { MESSAGE } = require('../const');
const { User } = require('../models/userSchema');
const { createUser, deleteUser, updateUser, loginUser } = require('../services/userServices');
const authMiddleware = require('../middlewares/authMiddleware');

// Получение всех пользователей (включая услуги для сотрудников)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({})
      .populate('services', 'name duration price');
    res.send(users);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Ошибка сервера' });
  }
});

// Получение одного пользователя по ID с услугами
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('services', 'name duration price');
    if (!user) return res.status(404).send({ error: 'Пользователь не найден' });
    res.send(user);
  } catch (e) {
    console.error(e);
    res.status(404).send({ error: 'Пользователь не найден' });
  }
});

// Регистрация нового пользователя
router.post('/register', async (req, res) => {
  const { fullName, phone, password } = req.body;
  try {
    await createUser({ fullName, phone, password });
    res.status(201).send({ message: 'Пользователь создан' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Ошибка при создании пользователя' });
  }
});

// Логин
router.post('/login', async (req, res) => {
  const { phone, password } = req.body;
  try {
    const token = await loginUser(phone, password);
    res.send({ token });
  } catch (e) {
    console.error(e);
    res.status(401).send({ error: e.message });
  }
});

// Создание пользователя (админом)
router.post('/', authMiddleware, async (req, res) => {
  const { fullName, phone, password, roles, services } = req.body;
  try {
    await createUser({ fullName, phone, password, roles, services });
    res.send(MESSAGE.CREATE_USER);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

// Удаление пользователя
router.delete('/:userId', authMiddleware, async (req, res) => {
  try {
    await deleteUser(req.params.userId);
    res.send(MESSAGE.DELETE_USER);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

// Обновление данных пользователя
router.put('/:userId/edit', authMiddleware, async (req, res) => {
  const { fullName, phone, services } = req.body;
  try {
    await updateUser(req.params.userId, { fullName, phone, services });
    res.send(MESSAGE.UPDATE_USER_DATA);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: e.message });
  }
});

module.exports = router;
