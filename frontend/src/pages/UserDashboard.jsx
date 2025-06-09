import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import "../styles/toast.css";

const UserDashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLogout = () => {
    localStorage.removeItem('token');
    toast.info('Вы вышли из системы');
    navigate('/', { replace: true });
  };

  React.useEffect(() => {
    if (!token) {
      toast.warning('Авторизуйтесь для доступа');
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <div className="text-xl font-bold text-[#14532d]">Body Harmony</div>
        <div className="space-x-2">
          <button
            onClick={() => navigate('/booking')}
            className="bg-[#14532d] text-white px-4 py-2 rounded hover:bg-[#15803d]"
          >
            Записаться
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="bg-[#14532d] text-white px-4 py-2 rounded hover:bg-[#15803d]"
          >
            Мои записи
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
        {/* <button
          onClick={() => navigate('/booking')}
          className="mt-4 bg-[#14532d] text-white px-6 py-2 rounded hover:bg-[#15803d]"
        >
          Записаться
        </button> */}
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

    </div>
  );
};

export default UserDashboard;
