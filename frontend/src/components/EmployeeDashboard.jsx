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

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/', { replace: true });
  };

  // Fetch both active appointments and slots
  const fetchEvents = async () => {
    try {
      const [appointmentsRes, slotsRes] = await Promise.all([
        axios.get(`http://localhost:8000/appointments?employeeId=${employeeId}`, { headers }),
        axios.get(`http://localhost:8000/slots?employeeId=${employeeId}`, { headers })
      ]);

      // Only include active appointments
      const appointments = appointmentsRes.data.filter(a => a.status === 'active');
      const slots = slotsRes.data;

      // Map appointments using new schema
      const appointmentEvents = appointments.map(appt => {
        const start = new Date(appt.date);
        const end = new Date(start.getTime() + appt.totalDuration * 60000);
        return {
          id: appt._id,
          title: `Запись: ${appt.services.map(s => s.serviceId.name).join(', ')}`,
          start,
          end,
          backgroundColor: '#EF4444',
          borderColor: '#B91C1C',
          editable: true,
          extendedProps: {
            type: 'appointment',
            clientName: appt.clientId.fullName,
            services: appt.services.map(s => ({ name: s.serviceId.name, duration: s.duration, price: s.price })),
            totalDuration: appt.totalDuration,
            totalPrice: appt.totalPrice
          }
        };
      });

      // Map free slots
      const occupiedRanges = appointmentEvents.map(ev => [ev.start, ev.end]);
      const slotEvents = slots
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

  // Handle drag/drop or resize
  const handleEventDrop = async info => {
    const evt = info.event;
    const isAppt = evt.extendedProps.type === 'appointment';
    const newDate = evt.start;
    try {
      if (isAppt) {
        await axios.put(
          `http://localhost:8000/appointments/${evt.id}`,
          { date: newDate.toISOString() },
          { headers }
        );
      } else {
        await axios.put(
          `http://localhost:8000/slots/${evt.id}`,
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

  // Click handler: show details or delete slot
  const handleEventClick = info => {
    const evt = info.event;
    if (evt.extendedProps.type === 'appointment') {
      setSelectedEvent({
        clientName: evt.extendedProps.clientName,
        services: evt.extendedProps.services,
        totalDuration: evt.extendedProps.totalDuration,
        totalPrice: evt.extendedProps.totalPrice
      });
    } else {
      if (window.confirm('Удалить этот свободный слот?')) {
        axios.delete(`http://localhost:8000/slots/${evt.id}`, { headers })
          .then(fetchEvents)
          .catch(e => console.error('Ошибка при удалении слота:', e));
      }
    }
  };

  // Generate slots when selecting
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
        'http://localhost:8000/slots/generate',
        { employeeId, date, startTime, endTime },
        { headers }
      );
      fetchEvents();
    } catch (e) {
      console.error('Ошибка при генерации слотов:', e);
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    // Initial fetch and polling
    fetchEvents();
    const intervalId = setInterval(fetchEvents, 15000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4">
      {/* Logout button */}
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
        slotMinTime="08:00:00"
        slotMaxTime="21:00:00"
        allDaySlot={false}
        slotDuration="00:15:00"
        slotLabelInterval="00:30:00"
      />

      {/* Selected appointment details */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Детали записи</h2>
            <p><strong>Клиент:</strong> {selectedEvent.clientName}</p>
            <div className="mt-2">
              <strong>Услуги:</strong>
              <ul className="list-disc list-inside">
                {selectedEvent.services.map((s, i) => (
                  <li key={i}>{s.name}</li>
                ))}
              </ul>
            </div>
            <p className="mt-2"><strong>Итого стоимость:</strong> {selectedEvent.totalPrice} ₽</p>
            <button onClick={() => setSelectedEvent(null)} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
