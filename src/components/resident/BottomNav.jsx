import { Megaphone, MapPinned, MessageCircleMore, Plus, Settings } from 'lucide-react'
import React from 'react'

const BottomNav = ({setActiveTab, activeTab}) => {
  return (
    <div className="fixed z-50 w-full h-16 max-w-lg -translate-x-1/2 bottom-4 left-1/2 px-4">
      <div className="w-full h-full bg-white border border-gray-200 rounded-full shadow-xl flex items-center justify-between px-2 relative">
        
        {/* Tab 1: News */}
        <button 
          onClick={() => setActiveTab('news')}
          className={`flex-1 flex flex-col items-center justify-center h-full rounded-l-full group transition-colors ${activeTab === 'news' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}
        >
          <Megaphone className="w-6 h-6 mb-1" strokeWidth={activeTab === 'news' ? 2.5 : 2} />
          <span className="sr-only">News</span>
        </button>

        {/* Tab 2: Map/Alerts */}
        <button 
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex flex-col items-center justify-center h-full group transition-colors ${activeTab === 'map' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}
        >
          <MapPinned className="w-6 h-6 mb-1" strokeWidth={activeTab === 'map' ? 2.5 : 2} />
          <span className="sr-only">Map</span>
        </button>

        {/* Middle: Main Action (Report/SOS) */}
        <div className="flex items-center justify-center -mt-8 mx-2">
          <button 
            onClick={() => setActiveTab('create')}
            className="flex items-center justify-center w-14 h-14 bg-orange-600 hover:bg-orange-700 text-white rounded-full shadow-lg border-4 border-gray-50 transition-transform active:scale-95"
          >
            <Plus className="w-8 h-8" />
            <span className="sr-only">New Report</span>
          </button>
        </div>

        {/* Tab 3: Messages */}
        <button 
          onClick={() => setActiveTab('messages')}
          className={`flex-1 flex flex-col items-center justify-center h-full group transition-colors ${activeTab === 'messages' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}
        >
          <MessageCircleMore className="w-6 h-6 mb-1" strokeWidth={activeTab === 'messages' ? 2.5 : 2} />
          <span className="sr-only">Messages</span>
        </button>

        {/* Tab 4: Profile/Settings */}
        <button 
          onClick={() => setActiveTab('settings')}
          className={`flex-1 flex flex-col items-center justify-center h-full rounded-r-full group transition-colors ${activeTab === 'settings' ? 'text-orange-600' : 'text-gray-500 hover:text-orange-500'}`}
        >
          <Settings className="w-6 h-6 mb-1" strokeWidth={activeTab === 'settings' ? 2.5 : 2} />
          <span className="sr-only">Settings</span>
        </button>

      </div>
    </div>
  )
}

export default BottomNav
