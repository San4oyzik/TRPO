const { User } = require('../models/userSchema.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Создание нового пользователя с полями fullName и phone
const createUser = async ({ fullName, phone, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return User.create({
    fullName,
    phone,
    password: hashedPassword
  });
};

// Логин и генерация токена по телефону
const loginUser = async (phone, password) => {
  const user = await User.findOne({ phone });
  if (!user) throw new Error('Пользователь не найден');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Неверный пароль');

  const token = jwt.sign({ id: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '8h' });
  return token;
};

// Удаление пользователя
const deleteUser = (userId) => {
  return User.findByIdAndDelete(userId);
};

// Обновление пользователя
const updateUser = (userId, { fullName, phone }) => {
  return User.findByIdAndUpdate(
    userId,
    { fullName, phone },
    { new: true }
  );
};

// Получение пользователя по ID
const getUserById = (userId) => {
  return User.findById(userId);
};

module.exports = { createUser, loginUser, deleteUser, updateUser, getUserById };
