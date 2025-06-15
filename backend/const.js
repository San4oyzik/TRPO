const PORT = process.env.PORT;

const MESSAGE = {
  SERVER_RUNNING: 'Сервер запущен!',
  CREATE_USER: 'Пользователь создан!',
  DELETE_USER: 'Пользователь удален!',
  UPDATE_USERNAME: 'Имя пользователя успешно изменено!',
  UPDATE_USER_EMAIL: 'Почта пользователя успешно изменена!',
}

const ERORRS = {
  NOT_STRING: 'Введите строковое значение!',
  INVALID_USER: 'Не верный пользователь'
}

module.exports = {ERORRS, MESSAGE, PORT}