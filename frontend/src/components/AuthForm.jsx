import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthForm = () => {
  const [mode, setMode] = useState("register");
  const [form, setForm] = useState({ fullName: "", phone: "", password: "" });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const rawPhone = form.phone.trim();
  const phone = `7${rawPhone}`;
  const phoneRegex = /^7\d{10}$/;

  if (!phoneRegex.test(phone)) {
    toast.error("Введите корректный номер телефона (например, 79123456789)");
    return;
  }

  if (!form.password || form.password.length < 6) {
    toast.error("Пароль должен содержать минимум 6 символов");
    return;
  }

  if (mode === "register" && (!form.fullName || form.fullName.trim().length < 2)) {
    toast.error("Введите корректное имя");
    return;
  }

  const url =
    mode === "register"
      ? "http://45.146.165.22:8000/user/register"
      : "http://45.146.165.22:8000/user/login";

  const payload =
    mode === "register"
      ? { ...form, phone } // в registration — всё тело, но номер заменили
      : { phone, password: form.password };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      const decoded = JSON.parse(atob(data.token.split(".")[1]));
      localStorage.setItem("user", JSON.stringify(decoded));
      toast.success("Успешный вход!");

      const roles = decoded.roles || [];

      if (roles.includes("admin")) {
        navigate("/dashboard");
      } else if (roles.includes("employee")) {
        navigate("/employee-calendar");
      } else {
        navigate("/user-dashboard");
      }
    } else {
      toast.error(data.message || data.error || "Ошибка входа");
    }
  } catch (err) {
    toast.error("Ошибка запроса");
  }
};



  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f5f5f5] px-4">
      <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-md border border-gray-200">
        <div className="flex justify-center mb-6">
          <button
            onClick={() => setMode("register")}
            className={`px-4 py-2 rounded-l-lg text-sm font-medium transition ${
              mode === "register"
                ? "bg-[#14532d] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Регистрация
          </button>
          <button
            onClick={() => setMode("login")}
            className={`px-4 py-2 rounded-r-lg text-sm font-medium transition ${
              mode === "login"
                ? "bg-[#14532d] text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            Вход
          </button>
        </div>

        <h2 className="text-xl font-semibold text-center mb-4 text-[#14532d]">
          {mode === "register" ? "Регистрация" : "Вход"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {mode === "register" ? (
            <RegisterForm form={form} handleChange={handleChange} />
          ) : (
            <LoginForm form={form} handleChange={handleChange} />
          )}

          <button
            type="submit"
            className="bg-[#14532d] hover:bg-[#15803d] text-white py-3 rounded-lg transition-all font-medium"
          >
            {mode === "register" ? "Зарегистрироваться" : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;
