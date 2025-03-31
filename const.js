const PORT = process.env.PORT;

const MESSAGE = {
  SERVER_RUNNING: 'Сервер запущен! <br> Введи в пути <strong>/tasks</strong>, для вывода списка задач <br> Введи <strong>/user</strong>, для вывода списка пользователей ',
  CREATE_TASK: 'Задача добавлена!',
  DELETE_TASK: 'Задача успешно удалена!',
  CREATE_USER: 'Пользователь создан!',
  DELETE_USER: 'Пользователь удален!',
  UPDATE_USERNAME: 'Имя пользователя успешно изменено!',
  UPDATE_USER_EMAIL: 'Почта пользователя успешно изменена!',
  UPDATE_TASK: 'Задача изменена успешно!'
}

const ERORRS = {
  DONT_HAVE_TASK : 'Такой задачи нет в списке!',
  HAVE_TASK: `Задача уже есть в списке!`,
  NOT_STRING: 'Введите строковое значение!',
  LENGTH_TASK: 'Длина строки должна быть больше 3 и меньше 50 символов!',
  DONT_HAVE_STATUS: 'Не верно указан статус задачи!',
  INVALID_USER: 'Не верный пользователь'
}

module.exports = {ERORRS, MESSAGE, PORT}