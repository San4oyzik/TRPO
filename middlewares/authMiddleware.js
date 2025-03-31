const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).send({ error: 'Доступ запрещен. Токен не найден' });

  try {
    const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (e) {
    res.status(403).send({ error: 'Неверный или просроченный токен' });
  }
};

module.exports = authMiddleware;