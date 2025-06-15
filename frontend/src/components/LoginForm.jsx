// components/LoginForm.jsx
import PhoneInput from "./PhoneInput";

const LoginForm = ({ form, handleChange }) => {
  return (
    <>
      <PhoneInput value={form.phone} onChange={handleChange} />
      <input
        type="password"
        name="password"
        placeholder="Пароль"
        value={form.password}
        onChange={handleChange}
        required
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15803d]"
      />
    </>
  );
};

export default LoginForm;
