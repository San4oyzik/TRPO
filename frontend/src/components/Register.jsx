import { useState } from "react";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: ""
  });

  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:8000/user/register", formData);
      setMessage(res.data.message || "Успешная регистрация");
      setSuccess(true);
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка регистрации");
      setSuccess(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f5f5f5] px-4">
      <div className="bg-white shadow-md rounded-xl p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-2xl font-bold text-[#14532d] mb-2 text-center">Регистрация</h2>
        <p className="text-gray-600 mb-6 text-center text-sm">
          Заполните форму, чтобы создать аккаунт
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            name="fullName"
            placeholder="ФИО"
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15803d]"
          />
          <input
            type="tel"
            name="phone"
            placeholder="Телефон"
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15803d]"
          />
          <input
            type="password"
            name="password"
            placeholder="Пароль"
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#15803d]"
          />
          <button
            type="submit"
            className="w-full py-3 bg-[#14532d] text-white rounded-md hover:bg-[#15803d] transition"
          >
            Зарегистрироваться
          </button>
        </form>

        {message && (
          <p className={`mt-4 text-center text-sm font-medium ${success ? "text-green-600" : "text-red-600"}`}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
