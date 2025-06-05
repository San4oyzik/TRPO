import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';

const user = JSON.parse(localStorage.getItem('user'));

export default function Dashboard() {
  const location = useLocation();

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

  return (
    <div className="flex min-h-screen bg-[#f5f5f5] text-[#1f2937]">
      {/* Левое меню */}
      <aside className="w-64 bg-white p-6 shadow-md border-r border-gray-200">
        <h2 className="text-xl font-bold mb-6 text-[#14532d]">Админ-панель</h2>
        <nav className="flex flex-col space-y-4">
          <Link
            to="schedule"
            className="hover:text-[#15803d] transition-colors duration-150"
          >
            📅 Расписание сотрудников
          </Link>
          <Link
            to="appointments"
            className="hover:text-[#15803d] transition-colors duration-150"
          >
            📋 Записи студии
          </Link>
          <Link
            to="finance"
            className="hover:text-[#15803d] transition-colors duration-150"
          >
            💰 Финансовые показатели
          </Link>
          <Link
            to="clients"
            className="hover:text-[#15803d] transition-colors duration-150"
          >
            🧍 Список клиентов
          </Link>
          <Link
            to="services"
            className="hover:text-[#15803d] transition-colors duration-150"
          >
            🛠 Услуги
          </Link>
        </nav>
      </aside>

      {/* Контент справа */}
      <main className="flex-1 p-8 bg-[#fafafa]">
        <Outlet />
      </main>
    </div>
  );
}
