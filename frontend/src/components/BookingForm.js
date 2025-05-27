import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const BookingForm = () => {
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedService, setSelectedService] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const [servicesRes, employeesRes] = await Promise.all([
          axios.get('http://localhost:8000/services', { headers }),
          axios.get('http://localhost:8000/user', { headers })
        ]);

        setServices(servicesRes.data);
        setEmployees(employeesRes.data.filter((u) => u.roles?.includes('employee')));
      } catch (e) {
        console.error('Ошибка загрузки начальных данных:', e);
        setMessage('Не удалось загрузить данные');
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedEmployee) return;
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const res = await axios.get(
          `http://localhost:8000/slots/availability?employeeId=${selectedEmployee}`,
          { headers }
        );

        setAvailableDates(res.data.availableDates);
        setSelectedDate(res.data.availableDates[0] || '');
        setAvailableTimes(res.data.slots[res.data.availableDates[0]] || []);
      } catch (e) {
        console.error('Ошибка загрузки слотов:', e);
        setMessage('Не удалось загрузить доступные слоты');
      }
    };

    fetchSlots();
  }, [selectedEmployee]);

  useEffect(() => {
    const fetchSlotTimes = async () => {
      if (!selectedEmployee || !selectedDate) return;
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      try {
        const res = await axios.get(
          `http://localhost:8000/slots/availability?employeeId=${selectedEmployee}`,
          { headers }
        );
        setAvailableTimes(res.data.slots[selectedDate] || []);
      } catch (e) {
        console.error('Ошибка загрузки времени:', e);
      }
    };

    fetchSlotTimes();
  }, [selectedDate, selectedEmployee]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const decoded = JSON.parse(atob(token.split('.')[1]));
    const clientId = decoded.id;

    try {
      const dateTimeStr = `${selectedDate}T${selectedTime}`;
      await axios.post('http://localhost:8000/appointments', {
        clientId,
        employeeId: selectedEmployee,
        serviceId: selectedService,
        date: new Date(dateTimeStr).toISOString()
      }, { headers });

      setMessage('Успешно записан!');

      const res = await axios.get(`http://localhost:8000/slots/availability?employeeId=${selectedEmployee}`, { headers });
      setAvailableDates(res.data.availableDates);
      setAvailableTimes(res.data.slots[selectedDate] || []);
    } catch (e) {
      console.error(e);
      setMessage('Ошибка при создании записи');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Запись на услугу</h2>
      {message && <p className="mb-4 text-sm text-red-600">{message}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Услуга</label>
          <select className="w-full p-2 border rounded" value={selectedService} onChange={(e) => setSelectedService(e.target.value)} required>
            <option value="">Выберите услугу</option>
            {services.map((service) => (
              <option key={service._id} value={service._id}>
                {service.name} — {service.price}₽ ({service.duration} мин)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">Сотрудник</label>
          <select className="w-full p-2 border rounded" value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} required>
            <option value="">Выберите мастера</option>
            {employees.map((emp) => (
              <option key={emp._id} value={emp._id}>{emp.fullName || 'Без имени'}</option>
            ))}
          </select>
        </div>

        {availableDates.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Дата</label>
            <select className="w-full p-2 border rounded" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required>
              <option value="">Выберите дату</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>{date}</option>
              ))}
            </select>
          </div>
        )}

        {availableTimes.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Время</label>
            <select className="w-full p-2 border rounded" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} required>
              <option value="">Выберите время</option>
              {availableTimes.map((time, idx) => (
                <option key={idx} value={time}>{time}</option>
              ))}
            </select>
          </div>
        )}

        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Записаться
        </button>
      </form>

      <button
        onClick={() => navigate('/user-dashboard')}
        className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Назад
      </button>
    </div>
  );
};

export default BookingForm;
