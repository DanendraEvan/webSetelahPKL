import React from 'react';

const Button = ({ children, className = "bg-blue-600", onClick, type = "button" }) => {
  return (
    <button
      type={type}
      className={`h-10 px-6 font-semibold rounded-lg text-white text-center ${className} hover:opacity-90 transition duration-200 shadow-md`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
