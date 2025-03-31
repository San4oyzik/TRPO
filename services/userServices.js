const { User } = require('../userSchema.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const createUser = async ({ username, email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return User.create({
    username,
    email,
    password: hashedPassword
  });
};


const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error('Пользователь не найден');

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) throw new Error('Неверный пароль');

  const token = jwt.sign({ id: user._id, roles: user.roles }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return token;
};

const deleteUser = (userId) => {
  return User.findByIdAndDelete(userId)
}

const updateUser = (userId, {username, email}) => {
  return User.findByIdAndUpdate(
    userId,
    {
      username,
      email
    },
    {new: true}
)
}

const getUserById = (userId) => {
  return User.findById(userId);
}

module.exports = {createUser, loginUser, deleteUser, updateUser, getUserById};