// components/RegisterForm.jsx
import PhoneInput from "./PhoneInput";

const RegisterForm = ({ form, handleChange }) => {
  return (
    <>
      <input
        type="text"
        name="fullName"
        placeholder="ФИО"
        value={form.fullName}
        onChange={handleChange}
        required
        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#15803d]"
      />
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

export default RegisterForm;
