import React, { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import axios from 'axios';

const EmployeeDashboard = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };
  const decoded = JSON.parse(atob(token.split('.')[1]));
  const employeeId = decoded.id;

  const fetchEvents = async () => {
    try {
      const [appointmentsRes, slotsRes] = await Promise.all([
        axios.get(`http://localhost:8000/appointments?employeeId=${employeeId}`, { headers }),
        axios.get(`http://localhost:8000/slots?employeeId=${employeeId}`, { headers })
      ]);

      const appointments = appointmentsRes.data;
      const slots = slotsRes.data;

      const occupiedRanges = appointments.map(appt => {
        const start = new Date(appt.date);
        const end = new Date(start.getTime() + (appt.serviceId?.duration || 60) * 60000);
        return [start, end];
      });

      const appointmentEvents = appointments.map(appt => {
        const durationMinutes = appt.serviceId?.duration || 60;
        return {
          id: appt._id,
          title: `Запись: ${appt.clientId?.fullName || 'Клиент'}`,
          start: appt.date,
          end: new Date(new Date(appt.date).getTime() + durationMinutes * 60000),
          backgroundColor: '#EF4444',
          borderColor: '#B91C1C',
          editable: true,
          extendedProps: {
            type: 'appointment',
            fullName: appt.clientId?.fullName,
            service: appt.serviceId?.name,
            price: appt.serviceId?.price,
            duration: appt.serviceId?.duration
          }
        };
      });

      const slotEvents = slots.filter(slot => {
        const slotStart = new Date(`${slot.date}T${slot.time}`);
        const slotEnd = new Date(slotStart.getTime() + 30 * 60000);

        return !occupiedRanges.some(([start, end]) => slotStart < end && slotEnd > start);
      }).map(slot => {
        const slotStart = `${slot.date}T${slot.time}`;
        const endDate = new Date(`${slot.date}T${slot.time}`);
        endDate.setMinutes(endDate.getMinutes() + 30);

        return {
          id: slot._id,
          title: 'Свободный слот',
          start: slotStart,
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

  const handleEventDrop = async (info) => {
    const event = info.event;
    const id = event.id;
    const newDate = event.start;

    try {
      if (event.extendedProps.type === 'appointment') {
        await axios.put(`http://localhost:8000/appointments/${id}`, {
          date: newDate
        }, { headers });
      } else {
        await axios.put(`http://localhost:8000/slots/${id}`, {
          date: newDate.toISOString().split('T')[0],
          time: newDate.toTimeString().slice(0, 5)
        }, { headers });
      }
      fetchEvents();
    } catch (e) {
      console.error('Ошибка при обновлении события:', e);
    }
  };

  const deleteSlot = async (slotId) => {
    try {
      await axios.delete(`http://localhost:8000/slots/${slotId}`, { headers });
      fetchEvents();
    } catch (e) {
      console.error('Ошибка при удалении слота:', e);
    }
  };

  const handleEventClick = (info) => {
    const event = info.event;
    const type = event.extendedProps.type;

    if (type === 'appointment') {
      setSelectedEvent({
        title: event.title,
        fullName: event.extendedProps.fullName,
        service: event.extendedProps.service,
        price: event.extendedProps.price,
        duration: event.extendedProps.duration
      });
    } else if (type === 'slot') {
      const confirmed = window.confirm('Удалить этот свободный слот?');
      if (!confirmed) return;
      deleteSlot(event.id);
    }
  };

  const handleSlotGenerate = async (selectInfo) => {
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();

    const start = selectInfo.start;
    const end = selectInfo.end;

    const confirmed = window.confirm(
      `Сгенерировать слоты с ${start.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })} до ${end.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })}?`
    );

    if (!confirmed) return;

    try {
      const date = start.toISOString().split('T')[0];
      const startTime = start.toTimeString().slice(0, 5);
      const endTime = end.toTimeString().slice(0, 5);

      await axios.post(
        'http://localhost:8000/slots/generate',
        {
          employeeId,
          date,
          startTime,
          endTime
        },
        { headers }
      );

      fetchEvents();
    } catch (e) {
      console.error('Ошибка при генерации слотов:', e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Календарь сотрудника</h1>
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        editable={true}
        selectable={true}
        selectMirror={true}
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

      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Детали записи</h2>
            <p><strong>Клиент:</strong> {selectedEvent.fullName}</p>
            <p><strong>Услуга:</strong> {selectedEvent.service}</p>
            <p><strong>Длительность:</strong> {selectedEvent.duration} мин</p>
            <p><strong>Стоимость:</strong> {selectedEvent.price} ₽</p>
            <button
              onClick={() => setSelectedEvent(null)}
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDashboard;
