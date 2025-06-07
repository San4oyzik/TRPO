import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const BookingForm = () => {
  const [rawServices, setRawServices] = useState([]);
  const [rawEmployees, setRawEmployees] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [isExternal, setIsExternal] = useState(false);
  const [externalName, setExternalName] = useState('');
  const [externalPhone, setExternalPhone] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const [servicesRes, usersRes] = await Promise.all([
          axios.get('http://localhost:8000/services', { headers }),
          axios.get('http://localhost:8000/user', { headers }),
        ]);
        setRawServices(servicesRes.data);
        setRawEmployees(usersRes.data.filter((u) => u.roles?.includes('employee')));
      } catch (e) {
        toast.error('Не удалось загрузить данные');
      }
    };
    fetchInitialData();
  }, []);

  const toggleService = (id) => {
    const stringId = String(id);
    setSelectedServices((prev) =>
      prev.includes(stringId) ? prev.filter((s) => s !== stringId) : [...prev, stringId]
    );
  };

  const filteredServices = useMemo(() => rawServices, [rawServices]);

  const filteredEmployees = useMemo(() => {
    if (!selectedServices.length) return rawEmployees;
    return rawEmployees.filter((emp) => {
      const serviceIds = (emp.services || []).map((s) =>
        typeof s === 'object' ? String(s._id) : String(s)
      );
      return selectedServices.every((sid) => serviceIds.includes(sid));
    });
  }, [rawEmployees, selectedServices]);

  useEffect(() => {
    if (!selectedEmployee) {
      setAvailableDates([]);
      setAvailableTimes([]);
      setSelectedDate('');
      return;
    }
    const fetchDates = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const res = await axios.get(
          `http://localhost:8000/slots/availability?employeeId=${selectedEmployee}`,
          { headers }
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates = res.data.availableDates
          .filter((d) => new Date(d) >= today)
          .sort((a, b) => new Date(a) - new Date(b));
        setAvailableDates(dates);
        setSelectedDate(dates[0] || '');
      } catch (e) {
        toast.error('Не удалось загрузить даты');
      }
    };
    fetchDates();
  }, [selectedEmployee]);

  useEffect(() => {
    if (!selectedEmployee || !selectedDate) return;
    const fetchTimes = async () => {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      try {
        const res = await axios.get(
          `http://localhost:8000/slots/availability?employeeId=${selectedEmployee}`,
          { headers }
        );

        const slotKeys = Object.keys(res.data.slots);
        const matchedKey = slotKeys.find((k) => k.startsWith(selectedDate));
        let times = matchedKey ? res.data.slots[matchedKey] : [];

        if (selectedServices.length) {
          times = times.filter((t) => {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const start = new Date(`${selectedDate}T${t}`);
            if (selectedDate === todayStr && start <= now) return false;
            const totalDur = selectedServices.reduce((sum, sid) => {
              const svc = rawServices.find((s) => String(s._id) === sid);
              return sum + (svc?.duration || 0);
            }, 0);
            const slotsNeeded = Math.ceil(totalDur / 30);
            const slotSet = new Set(times);
            for (let i = 1; i < slotsNeeded; i++) {
              const next = new Date(start);
              next.setMinutes(next.getMinutes() + 30 * i);
              const nextStr = next.toTimeString().slice(0, 5);
              if (!slotSet.has(nextStr)) return false;
            }
            return true;
          });
        }

        times.sort((a, b) => {
          const [h1, m1] = a.split(':').map(Number);
          const [h2, m2] = b.split(':').map(Number);
          return h1 * 60 + m1 - (h2 * 60 + m2);
        });

        setAvailableTimes(times);
      } catch (e) {
        toast.error('Не удалось загрузить время');
      }
    };
    fetchTimes();
  }, [selectedEmployee, selectedDate, selectedServices, rawServices]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedServices.length || !selectedEmployee || !selectedDate || !selectedTime) {
      toast.warning('Заполните все поля');
      return;
    }

    if (isExternal && (!externalName.trim() || !externalPhone.trim())) {
      toast.warning('Введите имя и телефон клиента');
      return;
    }

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const clientId = JSON.parse(atob(token.split('.')[1])).id;

    try {
      const dt = new Date(`${selectedDate}T${selectedTime}`);
      await axios.post(
        'http://localhost:8000/appointments',
        {
          clientId,
          employeeId: selectedEmployee,
          services: selectedServices,
          date: dt.toISOString(),
          ...(isExternal ? { externalName, externalPhone } : {}),
        },
        { headers }
      );

      toast.success("Вы успешно записались!");
      setTimeout(() => window.location.reload(), 2000);
    } catch (e) {
      toast.error('Ошибка при записи');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-xl shadow border border-gray-200 mt-8">
      <h2 className="text-2xl font-bold mb-4 text-[#14532d]">Запись на услугу</h2>

      <div className="flex gap-4 mb-6">
        <button
          type="button"
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
            !isExternal ? "bg-[#14532d] text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setIsExternal(false)}
        >
          Записаться самому
        </button>
        <button
          type="button"
          className={`flex-1 px-4 py-2 rounded-lg font-medium transition ${
            isExternal ? "bg-[#14532d] text-white" : "bg-gray-200 text-gray-700"
          }`}
          onClick={() => setIsExternal(true)}
        >
          Записать другого
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {isExternal && (
          <>
            <div>
              <label className="block mb-1 font-medium">ФИО клиента</label>
              <input
                type="text"
                value={externalName}
                onChange={(e) => setExternalName(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#15803d]"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Телефон клиента</label>
              <input
                type="tel"
                value={externalPhone}
                onChange={(e) => setExternalPhone(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#15803d]"
              />
            </div>
          </>
        )}

        <div>
          <label className="block mb-1 font-medium">Услуги</label>
          <ul className="space-y-1">
            {filteredServices.map((s) => {
              const serviceId = String(s._id);
              return (
                <li key={serviceId}>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="mr-2"
                      value={serviceId}
                      checked={selectedServices.includes(serviceId)}
                      onChange={() => toggleService(serviceId)}
                    />
                    {s.name} — {s.duration} мин
                  </label>
                </li>
              );
            })}
          </ul>
        </div>

        {selectedServices.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Сотрудник</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#15803d]"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              required
            >
              <option value="">Выберите мастера</option>
              {filteredEmployees.map((emp) => (
                <option key={emp._id} value={String(emp._id)}>
                  {emp.fullName}
                </option>
              ))}
            </select>
          </div>
        )}

        {availableDates.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Дата</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#15803d]"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        )}

        {availableTimes.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Время</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#15803d]"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              required
            >
              {availableTimes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-[#14532d] hover:bg-[#15803d] text-white py-3 rounded-md transition font-semibold"
        >
          Записаться
        </button>
      </form>

      <button
        onClick={() => navigate('/user-dashboard')}
        className="mt-6 w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-2 rounded-md transition"
      >
        Назад
      </button>
    </div>
  );
};

export default BookingForm;
