import React from "react";

const AnalyticsPreview = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-gray-500 text-sm font-medium">Analytics Module</h3>
        <p className="text-gray-400 text-sm mt-2">
          Select "Residents" to manage users.
        </p>
      </div>
    </div>
  );
};

export default AnalyticsPreview;
