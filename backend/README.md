# Body Harmony — Система онлайн-записи для студии красоты

**Body Harmony** — это информационная система, разработанная для автоматизации процессов студии красоты. Система позволяет клиентам записываться на услуги онлайн, сотрудникам — управлять своим расписанием, а администратору — контролировать процессы и взаимодействовать с клиентской базой.

## 🚀 Возможности

- 📆 Онлайн-запись на услуги с выбором сотрудника и времени
- 👩‍🔧 Панель мастера: управление расписанием и записями
- 🧑‍💻 Личный кабинет клиента: просмотр записей, отмена, редактирование
- 🧑‍💼 Личный кабинет администратора: расписание всех сотрудников, клиентская база, управление услугами
- 🔐 Регистрация и авторизация (JWT)
- 🔄 Слоты генерируются автоматически и могут редактироваться вручную
- 🛠 Уведомления, статус записей (`active`, `completed`, `cancelled`)

---

## 🛠 Стек технологий

### Backend:
- Node.js
- Express.js
- MongoDB (через Mongoose)
- JWT (аутентификация)
- Bcrypt (хэширование паролей)

### Frontend:
- React
- Tailwind CSS
- Axios
- FullCalendar (отображение расписания)

---

## ⚙️ Установка

1. Клонируй репозиторий:
   ```bash
   git clone https://github.com/твой-репозиторий/body-harmony.git
   cd body-harmony
