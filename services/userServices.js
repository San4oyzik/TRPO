const { User } = require('../models/userSchema.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const createUser = async ({ fullName, phone, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return User.create({
    fullName,
    phone,
    password: hashedPassword
  });
};

const loginUser = async (phone, password) => {
  const user = await User.findOne({ phone });
  if (!user) throw new Error('Пользователь не найден');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Неверный пароль');

  const token = jwt.sign({ id: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '8h' });
  return token;
};

const deleteUser = (userId) => {
  return User.findByIdAndDelete(userId);
};

const updateUser = (userId, { fullName, phone, services }) => {
  return User.findByIdAndUpdate(
    userId,
    { fullName, phone, services },
    { new: true }
  );
};

const getUserById = (userId) => {
  return User.findById(userId);
};

module.exports = { createUser, loginUser, deleteUser, updateUser, getUserById };
