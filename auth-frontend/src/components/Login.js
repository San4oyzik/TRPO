import { useState } from "react";
import axios from "axios";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/user/login", formData);
      localStorage.setItem("token", res.data.token);
      setMessage("Успешный вход!");
    } catch (error) {
      setMessage(error.response?.data?.error || "Ошибка входа");
    }
  };

  return (
    <div>
      <h2>Вход</h2>
      <form onSubmit={handleSubmit}>
        <input type="email" name="email" placeholder="Email" onChange={handleChange} required />
        <input type="password" name="password" placeholder="Пароль" onChange={handleChange} required />
        <button type="submit">Войти</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Login;