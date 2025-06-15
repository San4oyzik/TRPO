const { User } = require('../models/userSchema.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Единая валидация для create, login, update
const validateUserData = ({ fullName, phone, password }) => {
  const phoneRegex = /^7\d{10}$/;

  if (phone && !phoneRegex.test(phone)) {
    throw new Error('Некорректный номер телефона. Используйте формат: 7XXXXXXXXXX');
  }

  if (password && (typeof password !== 'string' || password.length < 6)) {
    throw new Error('Пароль должен содержать минимум 6 символов');
  }

  if (fullName && (typeof fullName !== 'string' || fullName.trim().length < 2)) {
    throw new Error('Укажите корректное имя');
  }
};

const createUser = async ({ fullName, phone, password }) => {
  validateUserData({ fullName, phone, password });

  const existingUser = await User.findOne({ phone });
  if (existingUser) {
    throw new Error('Пользователь с таким номером уже существует');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  return User.create({
    fullName,
    phone,
    password: hashedPassword
  });
};

const loginUser = async (phone, password) => {
  validateUserData({ phone, password });

  const user = await User.findOne({ phone });
  if (!user) throw new Error('Пользователь не найден');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Неверный пароль');

  const token = jwt.sign(
    { id: user._id, roles: user.roles },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return token;
};

const deleteUser = (userId) => {
  return User.findByIdAndDelete(userId);
};

const updateUser = async (userId, { fullName, phone, services, password }) => {
  validateUserData({ fullName, phone });

  const updateData = { fullName, phone, services };

  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    updateData.password = hashedPassword;
  }

  return User.findByIdAndUpdate(userId, updateData, { new: true });
};

const getUserById = (userId) => {
  return User.findById(userId);
};

module.exports = {
  createUser,
  loginUser,
  deleteUser,
  updateUser,
  getUserById
};
