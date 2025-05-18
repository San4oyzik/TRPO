import { useState } from "react";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import PrivateRoute from "./privateRoute";

function Form() {
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ username: "", email: "", password: "" });
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
        : { email: form.email, password: form.password };

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
        navigate("/dashboard");
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
              name="username"
              placeholder="Имя"
              onChange={handleChange}
              className="p-2 border border-gray-300 rounded-lg"
              required
            />
          )}
          <input
            type="email"
            name="email"
            placeholder="Email"
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

function Dashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 text-xl text-gray-800 gap-4">
      <h1 className="font-semibold">Добро пожаловать 👋</h1>
      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
      >
        Выйти
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Form />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
      </Routes>
    </Router>
  );
}
