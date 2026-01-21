import Label from "./Label"
import Input from "./input"

const InputForm = ({ label, name, type, placeholder, onChange }) => {
  return (
    <div className="mb-3">
      <label className="block mb-1">{label}</label>
      <input
        className="border p-2 w-full"
        type={type}
        name={name}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
};

export default InputForm;
