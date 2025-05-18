const jwt = require('jsonwebtoken');
const { User } = require('../models/userSchema');

const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send({ error: 'Токен не найден' });

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET || 'secret');

    const user = await User.findById(decoded.id); // тут важно, что ты используешь decoded.id
    if (!user) return res.status(401).send({ error: 'Пользователь не найден' });

    req.user = user; // полноценный объект из базы
    next();
  } catch (e) {
    console.error('authMiddleware error:', e.message);
    res.status(403).send({ error: 'Неверный токен' });
  }
};

module.exports = authMiddleware;
