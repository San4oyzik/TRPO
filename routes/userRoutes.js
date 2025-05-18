const express = require('express');
const router = express.Router()
const {ERORRS, MESSAGE} = require('../const')
const { User } = require('../models/userSchema');
const {createUser, deleteUser, updateUser, loginUser} = require('../services/userServices');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middlewares/authMiddleware');


router.get('/', authMiddleware, async (req, res) => { 
  try {
    const users = await User.find({});
    res.send(users);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Ошибка сервера' });
  }
});


router.get('/:userId', authMiddleware, async (req, res) => { 
  const userId = req.params.userId
  try {
      const user = await User.findById(userId)
      await res.send(user)
  } catch (e) {
    console.error(e);
    res.status(401).send({ error: e.message });
  }
})

router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  try {
    await createUser({ username, email, password });
    res.status(201).send({ message: 'Пользователь создан' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: 'Ошибка при создании пользователя' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await loginUser(email, password);
    res.send({ token });
  } catch (e) {
    console.error(e);
    res.status(401).send({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  const {username, email, roles} = req.body
  const newUser = {username, email, roles}
  try {
      await createUser(newUser)
      console.log(newUser);
      await res.send(MESSAGE.CREATE_USER)
  } catch (e) {
    console.error(e);
    res.status(401).send({ error: e.message });
  }
})

router.delete('/:userId', authMiddleware, async (req, res) => {
  const userId = req.params.userId;
  try {
      await deleteUser(userId)
      await res.send(MESSAGE.DELETE_USER)
  } catch (e) {
    console.error(e);
    res.status(401).send({ error: e.message });
  }
})

router.put('/user/:userId/edit', authMiddleware, async (req, res) => {
  const userId = req.params.userId;
  const {username, email} = req.body;
  const userChange = {username, email};
  try {
      await updateUser(userId, userChange)
      await res.send(MESSAGE.UPDATE_USER_DATA)
  } catch (e) {
    console.error(e);
    res.status(401).send({ error: e.message });
  }
})

module.exports = router;