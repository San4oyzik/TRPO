import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const decoded = JSON.parse(atob(token.split('.')[1]));
  const userId = decoded.id;
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/appointments?clientId=${userId}`, { headers });
      setAppointments(res.data);
    } catch (e) {
      console.error('Ошибка загрузки записей клиента:', e);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/appointments/${id}`, { headers });
      setAppointments((prev) => prev.filter((appt) => appt._id !== id));
    } catch (e) {
      console.error('Ошибка отмены записи:', e);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Ваши записи</h1>
      {loading ? (
        <p>Загрузка...</p>
      ) : appointments.length === 0 ? (
        <p className="text-gray-600">У вас пока нет активных записей.</p>
      ) : (
        <ul className="space-y-4">
          {appointments.map((appt) => (
            <li key={appt._id} className="border p-4 rounded-md shadow-sm bg-white">
              <p><strong>Услуга:</strong> {appt.serviceId?.name}</p>
              <p><strong>Стоимость:</strong> {appt.serviceId?.price} ₽</p>
              <p><strong>Дата и время:</strong> {new Date(appt.date).toLocaleString()}</p>
              <p><strong>Мастер:</strong> {appt.employeeId?.fullName}</p>
              <p><strong>Статус:</strong> {appt.status}</p>
              {appt.status === 'active' && (
                <button
                  onClick={() => cancelAppointment(appt._id)}
                  className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                >
                  Отменить
                </button>
              )}
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
