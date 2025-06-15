import { useEffect, useState } from 'react';
import axios from 'axios';

export default function ClientList() {
  const [clients, setClients] = useState([]);
  const [expandedClientId, setExpandedClientId] = useState(null);
  const [appointmentsMap, setAppointmentsMap] = useState({});
  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await axios.get('http://localhost:8000/user', { headers });
        const users = res.data.filter(user => user.roles?.includes('user'));
        setClients(users);
      } catch (e) {
        console.error('Ошибка при загрузке клиентов:', e);
      }
    };

    fetchClients();
  }, []);

  const toggleClientDetails = async (clientId) => {
    if (expandedClientId === clientId) {
      setExpandedClientId(null);
      return;
    }

    setExpandedClientId(clientId);

    if (!appointmentsMap[clientId]) {
      try {
        const res = await axios.get(`http://localhost:8000/appointments?clientId=${clientId}`, { headers });
        setAppointmentsMap(prev => ({ ...prev, [clientId]: res.data }));
      } catch (e) {
        console.error('Ошибка при получении записей клиента:', e);
      }
    }
  };

  const getStatusClasses = (status) => {
    switch (status) {
      case 'active':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 bg-[#f5f5f5] min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-[#14532d]">Список клиентов</h1>

      {clients.length === 0 ? (
        <p className="text-gray-500">Нет клиентов для отображения</p>
      ) : (
        <div className="space-y-4">
          {clients.map(client => (
            <div key={client._id} className="bg-white rounded-md shadow border border-gray-200">
              <div className="p-4 flex justify-between items-center hover:bg-gray-50">
                <div>
                  <p className="font-semibold text-lg">{client.fullName}</p>
                  <p className="text-gray-500">{client.phone}</p>
                </div>
                <button
                  onClick={() => toggleClientDetails(client._id)}
                  className="text-sm flex items-center gap-1 px-3 py-1 rounded-md text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition"
                >
                  <span>{expandedClientId === client._id ? 'Скрыть' : 'Подробнее'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${expandedClientId === client._id ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              {expandedClientId === client._id && (
                <div className="px-4 pb-4">
                  <h3 className="font-medium text-gray-700 mb-2">История посещений:</h3>
                  <div className="space-y-2">
                    {(appointmentsMap[client._id] || []).map(appt => (
                      <div
                        key={appt._id}
                        className={`border rounded p-3 transition duration-150 ${getStatusClasses(appt.status)}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-gray-800 font-semibold">
                              {new Date(appt.date).toLocaleString('ru-RU')}
                            </p>
                            <p className="text-sm font-medium">
                              Статус: {appt.status}
                            </p>

                            {appt.externalName && (
                              <div className="mt-1 text-sm text-gray-700">
                                <p><span className="font-medium">Записан:</span> {appt.externalName}</p>
                                {appt.externalPhone && (
                                  <p><span className="font-medium">Телефон:</span> {appt.externalPhone}</p>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-sm font-medium whitespace-nowrap">
                            {appt.totalPrice} ₽
                          </p>
                        </div>

                        <ul className="mt-2 text-sm list-disc list-inside">
                          {appt.services.map(s => (
                            <li key={s.serviceId?._id}>
                              {s.serviceId?.name} — {s.duration} мин
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {(appointmentsMap[client._id] || []).length === 0 && (
                      <p className="text-sm text-gray-500">Нет записей</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
