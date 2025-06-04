import { Link, Outlet, useLocation, Navigate } from 'react-router-dom';

console.log("LocalStorage User:", localStorage.getItem("user"));

const user = JSON.parse(localStorage.getItem("user"));
console.log("Parsed user object:", user);


export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const location = useLocation();

  if (!user || !user.roles.includes('admin')) {
    return (
      <div className="p-8 text-red-600 font-semibold text-xl">
        У вас нет доступа к этой странице
      </div>
    );
  }

  // если находимся ровно на /dashboard — редиректим на расписание
  if (location.pathname === '/dashboard') {
    return <Navigate to="/dashboard/schedule" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-gray-100 p-6 shadow-md">
        <h2 className="text-xl font-bold mb-4">Админ-панель</h2>
        <nav className="flex flex-col space-y-3 text-gray-700">
          <Link to="schedule" className="hover:text-blue-600">📅 Расписание сотрудников</Link>
          <Link to="appointments" className="hover:text-blue-600">📋 Записи студии</Link>
          <Link to="finance" className="hover:text-blue-600">💰 Финансовые показатели</Link>
          <Link to="clients" className="hover:text-blue-600">🧍 Список клиентов</Link>
          <Link to="services" className="hover:text-blue-600">🛠 Услуги</Link>
        </nav>
      </aside>

      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
