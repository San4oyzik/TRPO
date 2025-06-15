// components/PhoneInput.jsx
import { IMaskInput } from 'react-imask';

const PhoneInput = ({ value, onChange }) => {
  return (
    <IMaskInput
      mask="+7 (000) 000-00-00"
      definitions={{
        '0': /[0-9]/,
      }}
      unmask={true}
      name="phone"
      value={value}
      onAccept={(val) => onChange({ target: { name: 'phone', value: val } })}
      placeholder="+7 (___) ___-__-__"
      required
      className="w-full p-3 border border-gray-300 rounded-mg focus:outline-none focus:ring-2 focus:ring-[#15803d]"
    />
  );
};

export default PhoneInput;
