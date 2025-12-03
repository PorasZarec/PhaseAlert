import React from "react";

const TabButton = ({ active, onClick, label }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap
        ${
          active
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
    >
      {label}
    </button>
  );
};

export default TabButton;
