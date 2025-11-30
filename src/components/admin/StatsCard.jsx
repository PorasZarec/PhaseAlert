import React from "react";

const StatsCard = ({ title, value, color, icon: Icon }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        {/* The 'color' prop is used here to set the background class */}
        <div className={`${color} p-3 rounded-lg`}>
          {/* The 'icon' prop is rendered as a component (conventionally renamed to 'Icon') */}
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
