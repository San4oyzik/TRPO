import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

const COLORS = [
  '#D0E6E1', '#E9D5EC', '#FBE8C7', '#DBEAFE',
  '#FBD5D5', '#EAE4D3', '#FDE68A', '#C4B5FD'
];

const EmployeeSchedule = () => {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchEmployees = async () => {
    const res = await axios.get('http://45.146.165.22:8000/user', { headers });
    const employeeList = res.data.filter(u => u.roles?.includes('employee'));
    setEmployees(employeeList);
  };

  const getColorByEmployee = (id) => {
    const index = employees.findIndex(e => e._id === id);
    return COLORS[index % COLORS.length] || '#E5E7EB';
  };

  const fetchEvents = async (employeeId = '') => {
    try {
      const slotsEndpoint = employeeId
        ? `http://45.146.165.22:8000/slots?employeeId=${employeeId}`
        : `http://45.146.165.22:8000/slots/all`;

      const appointmentsEndpoint = employeeId
        ? `http://45.146.165.22:8000/appointments?employeeId=${employeeId}`
        : `http://45.146.165.22:8000/appointments`;

      const [appointmentsRes, slotsRes] = await Promise.all([
        axios.get(appointmentsEndpoint, { headers }),
        axios.get(slotsEndpoint, { headers })
      ]);

      const appointments = appointmentsRes.data.filter(a =>
        ['active', 'completed'].includes(a.status)
      );

      const appointmentEvents = appointments.map(appt => {
        const start = new Date(appt.date);
        const end = new Date(start.getTime() + appt.totalDuration * 60000);
        const clientName = appt.externalName || appt.clientId?.fullName || 'Неизвестно';
        const clientPhone = appt.externalPhone || appt.clientId?.phone || '—';

        return {
          id: appt._id,
          title: `Запись: ${clientName}`,
          start,
          end,
          backgroundColor: appt.status === 'completed' ? '#3B82F6' : '#EF4444',
          borderColor: appt.status === 'completed' ? '#1D4ED8' : '#B91C1C',
          textColor: '#fff',
          extendedProps: {
            type: 'appointment',
            employeeId: appt.employeeId,
            clientName,
            clientPhone,
            status: appt.status,
            services: appt.services?.map(s => ({
              name: s.serviceId?.name,
              duration: s.duration,
              price: s.price
            })),
            totalDuration: appt.totalDuration,
            totalPrice: appt.totalPrice
          }
        };
      });

      const occupiedRanges = appointmentEvents.map(ev => [ev.start, ev.end]);
      const slotEvents = slotsRes.data
        .filter(slot => {
          const slotStart = new Date(`${slot.date}T${slot.time}`);
          const slotEnd = new Date(slotStart.getTime() + 30 * 60000);
          return !occupiedRanges.some(([s, e]) => slotStart < e && slotEnd > s);
        })
        .map(slot => {
          const start = `${slot.date}T${slot.time}`;
          const end = new Date(start);
          end.setMinutes(end.getMinutes() + 30);
          const color = getColorByEmployee(slot.employeeId);
          return {
            id: slot._id,
            title: 'Свободно',
            start,
            end: end.toISOString(),
            backgroundColor: color,
            borderColor: '#888',
            textColor: '#111827',
            extendedProps: {
              type: 'slot',
              employeeId: slot.employeeId
            }
          };
        });

      setEvents([...appointmentEvents, ...slotEvents]);
    } catch (e) {
      console.error('Ошибка при загрузке расписания:', e);
    }
  };

  const handleSlotGenerate = async (selectInfo) => {
    if (!selectedEmployeeId) {
      alert('Сначала выбери сотрудника');
      return;
    }

    const start = selectInfo.start;
    const end = selectInfo.end;
    const date = start.toISOString().split('T')[0];
    const startTime = start.toTimeString().slice(0, 5);
    const endTime = end.toTimeString().slice(0, 5);

    try {
      await axios.post(
        'http://45.146.165.22:8000/slots/generate',
        { employeeId: selectedEmployeeId, date, startTime, endTime },
        { headers }
      );
      fetchEvents(selectedEmployeeId);
    } catch (e) {
      console.error('Ошибка при генерации слотов:', e);
    }
  };

  const handleEventClick = (info) => {
    const evt = info.event;
    if (evt.extendedProps.type === 'appointment') {
      setSelectedEvent({
        id: evt.id,
        status: evt.extendedProps.status,
        clientName: evt.extendedProps.clientName,
        clientPhone: evt.extendedProps.clientPhone,
        services: evt.extendedProps.services,
        totalDuration: evt.extendedProps.totalDuration,
        totalPrice: evt.extendedProps.totalPrice
      });
    } else if (evt.extendedProps.type === 'slot') {
      if (window.confirm('Удалить слот?')) {
        axios.delete(`http://45.146.165.22:8000/slots/${evt.id}`, { headers })
          .then(() => fetchEvents(selectedEmployeeId))
          .catch(err => console.error('Ошибка при удалении слота:', err));
      }
    }
  };

  const handleMarkAsCompleted = async () => {
    try {
      await axios.put(`http://45.146.165.22:8000/appointments/${selectedEvent.id}`, {
        status: 'completed'
      }, { headers });
      setSelectedEvent(null);
      fetchEvents(selectedEmployeeId);
    } catch (e) {
      console.error('Ошибка при установке статуса completed:', e);
    }
  };

  const handleCancelAppointment = async () => {
    try {
      await axios.delete(`http://45.146.165.22:8000/appointments/${selectedEvent.id}`, { headers });
      setSelectedEvent(null);
      fetchEvents(selectedEmployeeId);
    } catch (e) {
      console.error('Ошибка при отмене записи:', e);
    }
  };

  const handleEventDrop = async info => {
  const evt = info.event;
  const newDate = evt.start;

  try {
    if (evt.extendedProps.type === 'appointment') {
      await axios.put(
        `http://45.146.165.22:8000/appointments/${evt.id}`,
        { date: newDate.toISOString() },
        { headers }
      );
    } else if (evt.extendedProps.type === 'slot') {
      await axios.put(
        `http://45.146.165.22:8000/slots/${evt.id}`,
        {
          date: newDate.toISOString().split('T')[0],
          time: newDate.toTimeString().slice(0, 5)
        },
        { headers }
      );
    }

    fetchEvents(selectedEmployeeId);
  } catch (e) {
    console.error('Ошибка при переносе события:', e);
  }
};


  useEffect(() => {
    fetchEmployees().then(() => fetchEvents());
  }, []);

  useEffect(() => {
    if (employees.length) {
      fetchEvents(selectedEmployeeId);
    }
  }, [selectedEmployeeId, employees]);

  return (
    <div className="p-6 bg-[#f5f5f5] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-[#14532d]">Расписание сотрудников</h1>

      <div className="mb-6">
        <label htmlFor="employee" className="mr-2 font-medium text-gray-700">
          Фильтр по сотруднику:
        </label>
        <select
          id="employee"
          value={selectedEmployeeId}
          onChange={e => setSelectedEmployeeId(e.target.value)}
          className="border border-gray-300 p-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-[#15803d]"
        >
          <option value="">Все сотрудники</option>
          {employees.map(emp => (
            <option key={emp._id} value={emp._id}>{emp.fullName}</option>
          ))}
        </select>
      </div>

      <div className="bg-white p-4 rounded-md shadow border border-gray-200">
        <FullCalendar
          plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          editable={true}
          selectable
          select={handleSlotGenerate}
          events={events}
          locale="ru"
          height="auto"
          slotMinTime="08:30:00"
          slotMaxTime="18:00:00"
          allDaySlot={false}
          eventClick={handleEventClick}
        />
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md border border-gray-200">
            <h2 className="text-xl font-bold mb-4 text-[#14532d]">Детали записи</h2>
            <p><strong>Клиент:</strong> {selectedEvent.clientName}</p>
            <p><strong>Телефон:</strong> {selectedEvent.clientPhone}</p>
            <div className="mt-2">
              <strong>Услуги:</strong>
              <ul className="list-disc list-inside text-gray-700">
                {selectedEvent.services?.map((s, i) => (
                  <li key={i}>{s.name} — {s.duration} мин</li>
                ))}
              </ul>
            </div>
            <p className="mt-2"><strong>Итого:</strong> {selectedEvent.totalPrice} ₽</p>
            <p className="mt-2"><strong>Статус:</strong> {selectedEvent.status}</p>
            <div className="mt-6 flex gap-3 flex-wrap justify-end">
              {selectedEvent.status === 'active' && (
                <>
                  <button
                    onClick={handleMarkAsCompleted}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Отметить как пришёл
                  </button>
                  <button
                    onClick={handleCancelAppointment}
                    className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Отменить
                  </button>
                </>
              )}
              <button
                onClick={() => setSelectedEvent(null)}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeSchedule;