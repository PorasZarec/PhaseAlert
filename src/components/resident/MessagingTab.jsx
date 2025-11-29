import React from "react";

const MessagingTab = ({activeTab, loading}) => {
  return (
    <div>
      {/* Example Content Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {activeTab === "home" && "Community News"}
          {activeTab === "map" && "Phase Map"}
          {activeTab === "create" && "Create Incident Report"}
          {activeTab === "messages" && "Community Chat"}
          {activeTab === "settings" && "Settings"}
        </h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="text-sm text-gray-500 mt-3">Syncing data...</p>
          </div>
        ) : (
          <div className="h-48 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400">
            Content for {activeTab} goes here
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagingTab;