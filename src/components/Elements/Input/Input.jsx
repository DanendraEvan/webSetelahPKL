const Input = (props) => {
  const { type, placeholder, name, onChange } = props;
  return (
    <input
      type={type}
      placeholder={placeholder}
      name={name}
      id={name}
      onChange={onChange}  // 🔥 penting biar state ke-update
      className="text-sm border rounded w-full py-2 px-3 text-slate-700 placeholder:opacity-50"
    />
  );
};

export default Input;
