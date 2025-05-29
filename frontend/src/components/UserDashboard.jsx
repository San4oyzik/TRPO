import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const navigate = useNavigate();

  // ---- Logout handler ----
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  // Fetch only active appointments
  const fetchAppointments = async () => {
    try {
      const clientId = JSON.parse(atob(token.split('.')[1])).id;
      const res = await axios.get(
        `http://localhost:8000/appointments?clientId=${clientId}`,
        { headers }
      );
      // Показываем только активные записи
      setAppointments(res.data.filter(a => a.status === 'active'));
    } catch (e) {
      console.error('Ошибка загрузки записей клиента:', e);
    } finally {
      setLoading(false);
    }
  };

  // Cancel an appointment (mark as 'cancelled')
  const cancelAppointment = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/appointments/${id}`, { headers });
      await fetchAppointments();
    } catch (e) {
      console.error('Ошибка отмены записи:', e);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
    } else {
      fetchAppointments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p>Загрузка...</p>;

  return (
    <div className="p-6">
      {/* Logout */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Выйти
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Ваши записи</h1>

      {appointments.length === 0 ? (
        <p className="text-gray-600">У вас пока нет активных записей.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appt) => (
            <li key={appt._id} className="border p-4 rounded-md shadow-sm bg-white">
              <p><strong>Дата и время:</strong> {new Date(appt.date).toLocaleString()}</p>
              <p><strong>Мастер:</strong> {appt.employeeId.fullName}</p>

              {/* Список услуг */}
              <div className="mt-2">
                <strong>Услуги:</strong>
                <ul className="list-disc list-inside ml-4">
                  {appt.services.map((s, idx) => (
                    <li key={idx}>{s.serviceId.name}</li>
                  ))}
                </ul>
              </div>

              {/* Итоговая стоимость */}
              <p className="mt-2">
                <strong>Стоимость:</strong> {appt.totalPrice} ₽
              </p>

              {/* Кнопка отмены */}
              <button
                onClick={() => cancelAppointment(appt._id)}
                className="mt-3 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Отменить
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => navigate('/booking')}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Записаться
      </button>
    </div>
  );
};

export default UserDashboard;
