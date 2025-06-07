import { Link, Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import "../styles/toast.css";

const user = JSON.parse(localStorage.getItem('user'));

export default function Dashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  if (!user || !user.roles.includes('admin')) {
    return (
      <div className="p-8 text-red-600 font-semibold text-xl">
        У вас нет доступа к этой странице
      </div>
    );
  }

  if (location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/schedule" replace />;
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.info("Вы вышли из системы");
    navigate('/', { replace: true });
  };

  return (
  <div className="grid grid-cols-[16rem_1fr] min-h-screen bg-[#f5f5f5] text-[#1f2937]">
    {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md border-r border-gray-200 flex flex-col">
    <div className="p-6 flex-1">
      <h2 className="text-xl font-bold mb-6 text-[#14532d]">Админ-панель</h2>
      <nav className="flex flex-col space-y-4">
        <Link to="schedule" className="hover:text-[#15803d] transition-colors duration-150">
          📅 Расписание сотрудников
        </Link>
        <Link to="appointments" className="hover:text-[#15803d] transition-colors duration-150">
          📋 Записи студии
        </Link>
        <Link to="finance" className="hover:text-[#15803d] transition-colors duration-150">
          💰 Финансовые показатели
        </Link>
        <Link to="clients" className="hover:text-[#15803d] transition-colors duration-150">
          🧍 Список клиентов
        </Link>
        <Link to="services" className="hover:text-[#15803d] transition-colors duration-150">
          🛠 Услуги
        </Link>
      </nav>
    </div>

    {/* Кнопка выхода фиксирована снизу */}
    <div className="p-6 border-t border-gray-200 bg-white sticky bottom-0">
      <button
        onClick={handleLogout}
        className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded transition"
      >
        Выйти
      </button>
    </div>
  </aside>


    {/* Content */}
    <main className="p-8 bg-[#fafafa]">
      <Outlet />
    </main>
  </div>

  );
}
