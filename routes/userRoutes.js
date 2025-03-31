const express = require('express');
const router = express.Router()
const {ERORRS, MESSAGE} = require('../const')
const { User } = require('../userSchema');
const {createUser, deleteUser, updateUser} = require('../services/userServices');

// выводим список пользователей
router.get('/', async (req, res) => { 
  try {
      const user = await User.find({})
      await res.send(user)
  } catch (e) {
      console.error(e);
  }
})

// вывод отдельного пользователя по его userId
router.get('/:userId', async (req, res) => { 
  const userId = req.params.userId
  try {
      const user = await User.findById(userId)
      await res.send(user)
  } catch (e) {
      console.error(e);
  }
})

// функция добавлния пользователя
router.post('/', async (req, res) => {
  const {username, email, roles} = req.body
  const newUser = {username, email, roles}
  try {
      await createUser(newUser)
      console.log(newUser);
      await res.send(MESSAGE.CREATE_USER)
  } catch (e) {
      console.error(e);
  }
})

router.delete('/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
      await deleteUser(userId)
      await res.send(MESSAGE.DELETE_USER)
  } catch (e) {
      console.error(e);
  }
})

// Изменяем имя пользователя
router.put('/user/:userId/edit', async (req, res) => {
  const userId = req.params.userId;
  const {username, email} = req.body;
  const userChange = {username, email};
  try {
      await updateUser(userId, userChange)
      await res.send(MESSAGE.UPDATE_USER_DATA)
  } catch (e) {
      console.error(e);
  }
})

module.exports = router;