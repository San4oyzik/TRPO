import { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate
} from "react-router-dom";

import BookingForm from "./pages/BookingPage";
import PrivateRoute from "./privateRoute";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/Dashboard"; // это админская панель
import EmployeeSchedule from "./pages/EmployeeSchedule";
import AllAppointments from "./pages/AllAppointments";
import FinanceReport from "./pages/FinanceReport";
import ClientList from "./pages/ClientList";
import ServiceManager from "./pages/ServiceManager";

function Form() {
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ fullName: "", phone: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url =
      mode === "register"
        ? "http://localhost:8000/user/register"
        : "http://localhost:8000/user/login";

    const payload =
      mode === "register"
        ? form
        : { phone: form.phone, password: form.password };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        setMessage("Успешный вход!");

        const decoded = JSON.parse(atob(data.token.split('.')[1]));
        localStorage.setItem("user", JSON.stringify(decoded));
        const roles = decoded.roles || [];

        if (roles.includes('admin')) {
          navigate("/dashboard");
        } else if (roles.includes('employee')) {
          navigate("/employee-calendar");
        } else {
          navigate("/user-dashboard");
        }
      } else {
        setMessage(data.message || data.error || "Успешно");
      }
    } catch (err) {
      setMessage("Ошибка запроса");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setMode("register")}
            className={`px-4 py-2 rounded-l-lg text-sm font-medium ${
              mode === "register"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Регистрация
          </button>
          <button
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-r-lg text-sm font-medium ${
              mode === "login"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Вход
          </button>
        </div>

        <h2 className="text-xl font-semibold text-center mb-4">
          {mode === "register" ? "Регистрация" : "Вход"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" && (
            <input
              type="text"
              name="fullName"
              placeholder="ФИО"
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-lg"
              required
            />
          )}
          <input
            type="tel"
            name="phone"
            placeholder="Телефон"
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            onChange={handleChange}
            className="p-2 border border-gray-300 rounded-lg"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition-all"
          >
            {mode === "register" ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>

        {message && (
          <p className="text-center text-sm text-green-600 mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Form />} />
        <Route
          path="/booking"
          element={
            <PrivateRoute>
              <BookingForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/employee-calendar"
          element={
            <PrivateRoute>
              <EmployeeDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/user-dashboard"
          element={
            <PrivateRoute>
              <UserDashboard />
            </PrivateRoute>
          }
        />

        {/* Админский Dashboard с вложенными маршрутами */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AdminDashboard />
            </PrivateRoute>
          }
        >
          <Route path="schedule" element={<EmployeeSchedule />} />
          <Route path="appointments" element={<AllAppointments />} />
          <Route path="finance" element={<FinanceReport />} />
          <Route path="clients" element={<ClientList />} />
          <Route path="services" element={<ServiceManager />} />
        </Route>
      </Routes>
    </Router>
  );
}
