import React, { useMemo } from "react";
// REMOVED: useLoadScript
import { GoogleMap, Marker, Polygon, Circle } from "@react-google-maps/api";
import { useMapAlerts } from "../../hooks/useMapAlerts";
import { getZoneColor } from "../../lib/geoUtils";
import { VILLAGE_CENTER, VILLAGE_BOUNDARY } from "../../data/HelperData";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "../../services/supabaseClient";

const mapContainerStyle = { width: "100%", height: "calc(100vh - 200px)", borderRadius: "12px" };

const getDynamicPin = (color) => {
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1.5,
    strokeColor: "#FFFFFF",
    scale: 2,
    anchor: new window.google.maps.Point(12, 22),
  };
};

const MappingTab = () => {
  const [currentUser, setCurrentUser] = React.useState(null);
  const { activeZones } = useMapAlerts();

  const uniqueCircles = useMemo(() => {
    if (!activeZones) return [];
    const locationMap = new Map();
    const severityScore = {
      emergency: 4,
      warning: 3,
      info: 2,
      default: 1
    };

    activeZones.forEach((alert) => {
      let score = 1;
      const lower = (alert.category || "").toLowerCase();
      if (lower.includes("emergency")) score = 4;
      else if (lower.includes("outage")) score = 3;
      else if (lower.includes("water") || lower.includes("garbage")) score = 2;

      const color = getZoneColor(alert.category);

      alert.affected_area?.forEach((point) => {
        const key = `${point.lat}-${point.lng}`;
        const currentBest = locationMap.get(key);
        if (!currentBest || score > currentBest.score) {
          locationMap.set(key, { point, color, score });
        }
      });
    });
    return Array.from(locationMap.values());
  }, [activeZones]);

  React.useEffect(() => {
    const fetchMe = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if(user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(data);
      }
    }
    fetchMe();
  }, []);

  // REMOVED: useLoadScript hook block entirely.

  const mapCenter = useMemo(() => {
    if (currentUser?.latitude && currentUser?.longitude) {
      return { lat: currentUser.latitude, lng: currentUser.longitude };
    }
    return VILLAGE_CENTER;
  }, [currentUser]);

  const userStatusColor = useMemo(() => {
      if (!currentUser || !activeZones) return "#374151";
      const myAlerts = activeZones.filter(alert =>
        alert.recipient_ids && alert.recipient_ids.includes(currentUser.id)
      );
      if (myAlerts.length === 0) return "#374151";
      return getZoneColor(myAlerts[0].category);
    }, [activeZones, currentUser]);

  if (!currentUser) return <div className="flex justify-center p-10"><Loader2 className="animate-spin"/></div>;

  return (
    <div className="space-y-4">
      {activeZones?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg flex items-center gap-3 animate-pulse">
          <AlertTriangle className="text-orange-600 w-5 h-5" />
          <div>
            <p className="text-sm font-bold text-gray-800">Active Warning in Area</p>
            <p className="text-xs text-gray-600">Please check the map for colored zones.</p>
          </div>
        </div>
      )}

      <div className="rounded-xl overflow-hidden shadow-md border border-gray-200 relative">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={18}
          center={mapCenter}
          options={{ disableDefaultUI: false, streetViewControl: false, mapTypeControl: false }}
        >
          <Polygon
            paths={VILLAGE_BOUNDARY}
            options={{ fillColor: "#000", fillOpacity: 0.05, strokeColor: "#666", strokeWeight: 1, clickable: false }}
          />

          {uniqueCircles.map((item, index) => (
              <Circle
                key={`circle-${index}`}
                center={item.point}
                radius={25}
                options={{ fillColor: item.color, fillOpacity: 0.5, strokeColor: item.color, strokeWeight: 1, clickable: false }}
              />
          ))}

          <Marker
            position={{ lat: currentUser.latitude, lng: currentUser.longitude }}
            title="My Home"
            icon={getDynamicPin(userStatusColor)}
            animation={userStatusColor !== "#374151" ? window.google.maps.Animation.BOUNCE : null}
          />
        </GoogleMap>

        {/* Legend */}
        <div className="absolute top-2 right-2 bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-100 text-xs z-10 space-y-2">
           <div className="font-bold text-gray-500 mb-1">Legend</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-600 shadow-sm"></div> Emergency</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-sm"></div> Power Outage</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div> Water / Advisory</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-600 shadow-sm"></div> Garbage Collection</div>
           <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div> Community Event</div>
        </div>
      </div>
    </div>
  );
};

export default MappingTab;
