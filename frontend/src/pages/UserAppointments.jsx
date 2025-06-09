import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const UserAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    try {
      const clientId = JSON.parse(atob(token.split('.')[1])).id;
      const res = await axios.get(`http://localhost:8000/appointments?clientId=${clientId}`, {
        headers,
      });
      setAppointments(res.data.sort((a, b) => new Date(a.date) - new Date(b.date)));
    } catch (e) {
      toast.error('Не удалось загрузить записи');
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (id) => {
    try {
      await axios.delete(`http://localhost:8000/appointments/${id}`, { headers });
      toast.success('Запись отменена');
      await fetchAppointments();
    } catch (e) {
      toast.error('Ошибка при отмене');
    }
  };

  useEffect(() => {
    if (!token) {
      toast.warning('Авторизуйтесь для доступа');
      navigate('/', { replace: true });
    } else {
      fetchAppointments();
    }
  }, []);

  const now = new Date();
  const upcoming = appointments.filter((a) => a.status === 'active' && new Date(a.date) >= now);
  const history = appointments
    .filter((a) => {
      const apptEnd = new Date(new Date(a.date).getTime() + (a.totalDuration || 0) * 60000);
      return a.status !== 'active' || apptEnd < now;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // ← Сортировка по убыванию даты

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
      <h2 className="text-2xl font-bold">Ваши записи</h2>
      <button
        onClick={() => navigate('/user-dashboard')}
        className="text-sm bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
      >
        ← Назад
      </button>
    </div>

      {loading ? (
        <p>Загрузка...</p>
      ) : (
        <>
          {upcoming.length === 0 ? (
            <p className="text-gray-600">Нет активных записей.</p>
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

export default UserAppointments;