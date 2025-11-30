import React from 'react';
import { 
  Megaphone, AlertTriangle, Calendar, 
  CircleAlert, Clock
} from 'lucide-react';

const NewsCard = ({ alert, footer }) => {
  
  // Helper to determine styling based on category/urgency
  const getStyles = () => {
    if (alert.is_urgent) {
      return {
        container: 'border-red-200 ring-1 ring-red-100',
        header: 'bg-red-50/50 border-red-100',
        iconBox: 'bg-red-100 text-red-600',
        icon: <AlertTriangle className="w-5 h-5" />
      };
    }
    
    switch (alert.category) {
      case 'Event':
        return {
          container: 'bg-blue-100/50 border-blue-200',
          header: 'bg-blue-100/50 border-blue-200',
          iconBox: 'bg-blue-100 text-blue-600',
          icon: <Calendar className="w-5 h-5" />
        };
      case 'Advisory':
        return {
          container: 'bg-cyan-100/50 border-cyan-200',
          header: 'bg-cyan-100/50 border-cyan-200',
          iconBox: 'bg-cyan-100 text-cyan-600',
          icon: <CircleAlert className="w-5 h-5" />
        };
      case 'News':
      default:
        return {
          container: 'bg-amber-100/50 border-amber-200',
          header: 'bg-amber-100/50 border-amber-200',
          iconBox: 'bg-orange-100 text-orange-600',
          icon: <Megaphone className="w-5 h-5" />
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col ${styles.container}`}>
      {/* Header Section */}
      <div className={`px-5 py-4 flex justify-between items-start border-b ${styles.header}`}>
        <div className="flex gap-3">
          <div className={`p-2 rounded-lg shrink-0 ${styles.iconBox}`}>
            {styles.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 line-clamp-1">{alert.title}</h3>
            <p className="text-xs text-gray-500 capitalize">
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
        
        {alert.expires_at && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-md">
            <Clock className="w-3 h-3" /> 
            Expires: {new Date(alert.expires_at).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Footer Section (Dynamic) */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs">
        {footer ? footer : (
           <span className="text-gray-400">By {alert.profiles?.name || "Admin"}</span>
        )}
      </div>
    </div>
  );
};

export default NewsCard;