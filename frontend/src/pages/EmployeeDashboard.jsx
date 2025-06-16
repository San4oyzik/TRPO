import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EmployeeDashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const decoded = token ? JSON.parse(atob(token.split('.')[1])) : null;
  const employeeId = decoded?.id;
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  const fetchEvents = async () => {
    try {
      const [appointmentsRes, slotsRes] = await Promise.all([
        axios.get(`http://localhost:8000/appointments?employeeId=${employeeId}`, { headers }),
        axios.get(`http://localhost:8000/slots?employeeId=${employeeId}`, { headers })
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
          title: `Запись: ${appt.services.map(s => s.serviceId.name).join(', ')}`,
          start,
          end,
          backgroundColor: appt.status === 'completed' ? '#3B82F6' : '#EF4444',
          borderColor: appt.status === 'completed' ? '#1D4ED8' : '#B91C1C',
          editable: true,
          extendedProps: {
            type: 'appointment',
            status: appt.status,
            clientName,
            clientPhone,
            services: appt.services.map(s => ({
              name: s.serviceId.name,
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
          const endDate = new Date(start);
          endDate.setMinutes(endDate.getMinutes() + 30);
          return {
            id: slot._id,
            title: 'Свободный слот',
            start,
            end: endDate.toISOString(),
            backgroundColor: '#10B981',
            borderColor: '#047857',
            editable: true,
            extendedProps: { type: 'slot' }
          };
        });

      setEvents([...appointmentEvents, ...slotEvents]);
    } catch (e) {
      console.error('Ошибка при загрузке событий:', e);
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
      } else {
        await axios.put(
          `http://45.146.165.22:8000/slots/${evt.id}`,
          {
            date: newDate.toISOString().split('T')[0],
            time: newDate.toTimeString().slice(0, 5)
          },
          { headers }
        );
      }
      fetchEvents();
    } catch (e) {
      console.error('Ошибка при обновлении события:', e);
    }
  };

  const handleEventClick = info => {
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
    } else {
      if (window.confirm('Удалить этот свободный слот?')) {
        axios.delete(`http://45.146.165.22:8000/slots/${evt.id}`, { headers })
          .then(fetchEvents)
          .catch(e => console.error('Ошибка при удалении слота:', e));
      }
    }
  };

  const handleSlotGenerate = async selectInfo => {
    const cal = selectInfo.view.calendar;
    cal.unselect();
    const start = selectInfo.start;
    const end = selectInfo.end;
    if (!window.confirm(
      `Сгенерировать слоты с ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} до ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}?`
    )) return;

    try {
      const date = start.toISOString().split('T')[0];
      const startTime = start.toTimeString().slice(0, 5);
      const endTime = end.toTimeString().slice(0, 5);
      await axios.post(
        'http://45.146.165.22:8000/slots/generate',
        { employeeId, date, startTime, endTime },
        { headers }
      );
      fetchEvents();
    } catch (e) {
      console.error('Ошибка при генерации слотов:', e);
    }
  };

  const handleMarkAsCompleted = async () => {
    try {
      await axios.put(`http://45.146.165.22:8000/appointments/${selectedEvent.id}`, {
        status: 'completed'
      }, { headers });
      fetchEvents();
      setSelectedEvent(null);
    } catch (e) {
      console.error('Ошибка при установке статуса completed:', e);
    }
  };

  const handleCancelAppointment = async () => {
    try {
      await axios.delete(`http://45.146.165.22:8000/appointments/${selectedEvent.id}`, { headers });
      fetchEvents();
      setSelectedEvent(null);
    } catch (e) {
      console.error('Ошибка при отмене записи:', e);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    fetchEvents();
    const intervalId = setInterval(fetchEvents, 15000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Выйти
        </button>
      </div>

      <h1 className="text-2xl font-bold mb-4">Календарь сотрудника</h1>

      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        editable
        selectable
        selectMirror
        select={handleSlotGenerate}
        events={events}
        eventDrop={handleEventDrop}
        eventResize={handleEventDrop}
        eventClick={handleEventClick}
        locale="ru"
        height="auto"
        slotMinTime="08:30:00"
        slotMaxTime="18:00:00"
        allDaySlot={false}
        slotDuration="00:15:00"
        slotLabelInterval="00:30:00"
      />

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Детали записи</h2>
            <p><strong>Клиент:</strong> {selectedEvent.clientName}</p>
            <p><strong>Телефон:</strong> {selectedEvent.clientPhone}</p>
            <div className="mt-2">
              <strong>Услуги:</strong>
              <ul className="list-disc list-inside">
                {selectedEvent.services.map((s, i) => (
                  <li key={i}>{s.name}</li>
                ))}
              </ul>
            </div>
            <p className="mt-2"><strong>Итого стоимость:</strong> {selectedEvent.totalPrice} ₽</p>
            <p className="mt-2"><strong>Статус:</strong> {selectedEvent.status}</p>
            <div className="mt-4 flex gap-3 flex-wrap">
              {selectedEvent.status === 'active' && (
                <>
                  <button onClick={handleMarkAsCompleted} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    Отметить как пришёл
                  </button>
                  <button onClick={handleCancelAppointment} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                    Отменить
                  </button>
                </>
              )}
              <button onClick={() => setSelectedEvent(null)} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
