import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import "../styles/toast.css";

const UserDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Вы вышли из системы');
    navigate('/', { replace: true });
  };

  const fetchAppointments = async () => {
    try {
      const clientId = JSON.parse(atob(token.split('.')[1])).id;
      const res = await axios.get(`http://localhost:8000/appointments?clientId=${clientId}`, {
        headers,
      });
      setAppointments(res.data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (e) {
      toast.error('Не удалось загрузить записи клиента');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/appointments/${id}`, { headers });
      toast.success('Запись успешно отменена');
      await fetchAppointments();
    } catch (e) {
      toast.error('Ошибка при отмене записи');
    }
  };

  useEffect(() => {
    if (!token) {
      toast.warning('Авторизуйтесь для доступа');
      navigate('/', { replace: true });
    } else {
      fetchAppointments();
    }
    // eslint-disable-next-line
  }, []);

  const now = new Date();
  const upcoming = appointments.filter(
    (a) => a.status === 'active' && new Date(a.date) >= now
  );
  const history = appointments.filter((a) => {
    const apptEnd = new Date(new Date(a.date).getTime() + (a.totalDuration || 0) * 60000);
    return a.status !== 'active' || apptEnd < now;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-xl font-bold text-[#14532d]">Body Harmony</div>
        <nav className="space-x-4 hidden sm:block">
          <a href="#about" className="text-gray-600 hover:text-[#14532d]">О нас</a>
          <a href="#services" className="text-gray-600 hover:text-[#14532d]">Услуги</a>
          <a href="#contacts" className="text-gray-600 hover:text-[#14532d]">Контакты</a>
        </nav>
        <div className="space-x-2">
          <button
            onClick={() => navigate('/booking')}
            className="bg-[#14532d] text-white px-4 py-2 rounded hover:bg-[#15803d]"
          >
            Записаться
          </button>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Выйти
          </button>
        </div>
      </header>

      {/* HERO */}
      <section className="text-center py-12 bg-[#f0fdf4]" id="hero">
        <h1 className="text-4xl font-bold text-[#14532d]">Студия Body Harmony</h1>
        <p className="mt-2 text-gray-700">Уральская д. 43 офис 306, Каменск-Уральский</p>
        <p className="text-gray-600">Пн–Пт: 9:00–20:00 / Сб–Вс: 11:00–19:00</p>
        <button
          onClick={() => navigate('/booking')}
          className="mt-4 bg-[#14532d] text-white px-6 py-2 rounded hover:bg-[#15803d]"
        >
          Записаться
        </button>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-[#14532d] mb-2">О нас</h2>
        <p className="text-gray-700">
          В Body Harmony мы создаём атмосферу уюта и заботы. Наши мастера помогают вам расслабиться и почувствовать себя прекрасно.
        </p>
      </section>

      {/* SERVICES */}
      <section id="services" className="px-6 py-8 bg-white max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-[#14532d] mb-2">Наши услуги</h2>
        <ul className="list-disc ml-6 text-gray-700">
          <li>Маникюр и педикюр</li>
          <li>Массаж</li>
          <li>Наращивание ресниц</li>
          <li>Косметологические процедуры</li>
        </ul>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="px-6 py-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold text-[#14532d] mb-2">Контакты</h2>
        <p className="text-gray-700">Телефон: +7 (999) 123-45-67</p>
        <p className="text-gray-700">Instagram: @bodyharmony</p>
      </section>

      {/* APPOINTMENTS */}
      <section className="px-6 py-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Ваши записи</h2>

        {loading ? (
          <p>Загрузка...</p>
        ) : upcoming.length === 0 ? (
          <p className="text-gray-600">У вас пока нет активных записей.</p>
        ) : (
          <ul className="space-y-4">
            {upcoming.map((appt) => (
              <AppointmentCard key={appt._id} appt={appt} onCancel={cancelAppointment} />
            ))}
          </ul>
        )}

        {history.length > 0 && (
          <>
            <h3 className="text-xl font-semibold mt-8 mb-2">История посещений</h3>
            <ul className="space-y-4">
              {history.map((appt) => (
                <AppointmentCard key={appt._id} appt={appt} />
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
};

const AppointmentCard = ({ appt, onCancel }) => {
  const endDate = new Date(new Date(appt.date).getTime() + (appt.totalDuration || 0) * 60000);

  return (
    <li className="border p-4 rounded-md shadow-sm bg-white">
      <p><strong>Дата и время:</strong> {new Date(appt.date).toLocaleString()}</p>
      <p><strong>Мастер:</strong> {appt.employeeId.fullName}</p>
      <div className="mt-2">
        <strong>Услуги:</strong>
        <ul className="list-disc list-inside ml-4">
          {appt.services.map((s, idx) => (
            <li key={idx}>{s.serviceId.name}</li>
          ))}
        </ul>
      </div>
      <p className="mt-2"><strong>Стоимость:</strong> {appt.totalPrice} ₽</p>
      <p className="mt-1"><strong>Статус:</strong> {appt.status}</p>
      {onCancel && appt.status === 'active' && endDate > new Date() && (
        <button
          onClick={() => onCancel(appt._id)}
          className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
        >
          Отменить
        </button>
      )}
    </li>
  );
};

export default UserDashboard;
