import React from 'react';
import {
  Megaphone, AlertTriangle, Calendar,
  CircleAlert, Clock
} from 'lucide-react';

const NewsCard = ({ alert, footer }) => {

  // Determine styling based on category/urgency (Synced with geoUtils.js)
  const getStyles = () => {
    // Convert to lowercase for easier matching
    const category = (alert.category || "").toLowerCase();
    const isUrgent = alert.is_urgent || category.includes('emergency') || category.includes('storm');

    // 1. RED: Critical / Emergency / Storm -> PULSING
    if (isUrgent) {
      return {
        container: "border-red-300 ring-1 ring-red-200",
        header: "bg-red-600 border-red-600 animate-pulse-faster", // Keeps your custom pulse
        iconBox: "bg-red-700 text-red-100",
        icon: <AlertTriangle className="w-5 h-5 text-red-100" />,
        isUrgent: true // Flag to change text color to white
      };
    }

    // 2. AMBER: Power / Outage / Warning
    if (category.includes('outage') || category.includes('warning')) {
      return {
        container: 'bg-amber-100/50 border-amber-200',
        header: 'bg-amber-100/50 border-amber-200',
        iconBox: 'bg-orange-100 text-orange-600',
        icon: <Megaphone className="w-5 h-5" />
      };
    }

    // 3. BLUE: Water / Services
    if (category.includes('water') || category.includes('interruption')) {
      return {
        container: 'bg-blue-100/50 border-blue-200',
        header: 'bg-blue-100/50 border-blue-200',
        iconBox: 'bg-blue-100 text-blue-600',
        icon: <CircleAlert className="w-5 h-5" />
      };
    }

    // 4. PURPLE: Garbage / Collection
    if (category.includes('garbage') || category.includes('collection')) {
      return {
        container: 'bg-purple-100/50 border-purple-200',
        header: 'bg-purple-100/50 border-purple-200',
        iconBox: 'bg-purple-100 text-purple-600',
        icon: <Clock className="w-5 h-5" />
      };
    }

    // 5. GREEN: Event / Community
    if (category.includes('event') || category.includes('assembly') || category.includes('community')) {
      return {
        container: 'bg-emerald-100/50 border-emerald-200',
        header: 'bg-emerald-100/50 border-emerald-200',
        iconBox: 'bg-emerald-100 text-emerald-600',
        icon: <Calendar className="w-5 h-5" />
      };
    }

    // DEFAULT: General Info (Teal/Cyan)
    return {
      container: 'bg-cyan-100/50 border-cyan-200',
      header: 'bg-cyan-100/50 border-cyan-200',
      iconBox: 'bg-cyan-100 text-cyan-600',
      icon: <CircleAlert className="w-5 h-5" />
    };
  };

  const styles = getStyles();

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col ${styles.container}` }>
      {/* Header Section */}
      <div className={`px-5 py-4 flex justify-between items-start border-b ${styles.header}`}>
        <div className="flex gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${styles.iconBox}`}>
            {styles.icon}
          </div>
          <div>
          <h3 className={`font-semibold line-clamp-1
            ${styles.isUrgent ? "text-white" : "text-gray-800"}`}
          >
            {alert.title}
          </h3>

            <p className={`text-xs capitalize
              ${styles.isUrgent ? "text-white" : "text-gray-500"}`}
            >
              {alert.category} • {new Date(alert.created_at).toLocaleDateString()}
            </p>

          </div>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 flex-grow">
        {alert.image_url && (
          <img
            src={alert.image_url}
            alt="Alert"
            className="w-full h-40 object-cover rounded-lg mb-3 bg-gray-100"
          />
        )}
        <p className="text-gray-600 text-sm line-clamp-4 whitespace-pre-line">
          {alert.body}
        </p>
      </div>

      {/* Footer Section */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs">
        {footer ? footer : (
           <span className="text-gray-400">By {alert.profiles?.name || "Admin"}</span>
        )}
      </div>
    </div>
  );
};

export default NewsCard;
