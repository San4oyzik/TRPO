import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const UserDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  const fetchAppointments = async () => {
    try {
      const clientId = JSON.parse(atob(token.split('.')[1])).id;
      const res = await axios.get(
        `http://localhost:8000/appointments?clientId=${clientId}`,
        { headers }
      );
      setAppointments(
        res.data.sort((a, b) => new Date(a.date) - new Date(b.date))
      );
    } catch (e) {
      console.error('Ошибка загрузки записей клиента:', e);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) return <p className="p-6">Загрузка...</p>;

  const now = new Date();

  const upcoming = appointments.filter(a =>
    a.status === 'active' && new Date(a.date) >= now
  );

  const history = appointments.filter(a => {
    const apptEnd = new Date(new Date(a.date).getTime() + (a.totalDuration || 0) * 60000);
    return a.status !== 'active' || apptEnd < now;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => navigate('/booking')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
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

      <h1 className="text-2xl font-bold mb-4">Ваши записи</h1>

      {upcoming.length === 0 ? (
        <p className="text-gray-600">У вас пока нет активных записей.</p>
      ) : (
        <ul className="space-y-4">
          {upcoming.map(appt => (
            <AppointmentCard key={appt._id} appt={appt} onCancel={cancelAppointment} />
          ))}
        </ul>
      )}

      {history.length > 0 && (
        <>
          <h2 className="text-xl font-semibold mt-8 mb-2">История посещений</h2>
          <ul className="space-y-4">
            {history.map(appt => (
              <AppointmentCard key={appt._id} appt={appt} />
            ))}
          </ul>
        </>
      )}
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
