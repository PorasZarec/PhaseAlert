// Extracts lat/lng from residents for the map polygon
export const calculateZonePoints = (residents) => {
  if (!residents || residents.length === 0) return [];

  return residents.map(r => ({
    lat: Number(r.latitude),
    lng: Number(r.longitude)
  }));
};

// Returns the color based on the Alert Type provided in HelperData.js
export const getZoneColor = (type) => {
  if (!type) return "#6B7280"; // Default Gray
  const lowerType = type.toLowerCase();

  // 1. Red: Critical / Emergency
  if (lowerType.includes("emergency") || lowerType.includes("storm")) return "#DC2626";

  // 2. Amber: High Priority / Power
  if (lowerType.includes("outage") || lowerType.includes("warning")) return "#F59E0B";

  // 3. Blue: Services / Water (Specific Request)
  if (lowerType.includes("water") || lowerType.includes("interruption")) return "#3B82F6";

  // 4. Purple: Sanitation / Garbage
  if (lowerType.includes("garbage") || lowerType.includes("collection")) return "#9333EA";

  // 5. Green: Social / Events
  if (lowerType.includes("event") || lowerType.includes("assembly") || lowerType.includes("community")) return "#10B981";

  // 6. Teal: General Info
  return "#14B8A6";
};
