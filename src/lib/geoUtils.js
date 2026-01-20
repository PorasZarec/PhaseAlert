// SIMPLIFIED: Just extracts the lat/lng from the selected residents
export const calculateZonePoints = (residents) => {
  if (!residents || residents.length === 0) return [];

  return residents.map(r => ({
    lat: Number(r.latitude),
    lng: Number(r.longitude)
  }));
};

export const getZoneColor = (type) => {
  const lowerType = (type || "").toLowerCase();
  if (lowerType.includes("emergency") || lowerType.includes("storm")) return "#DC2626"; // Red
  if (lowerType.includes("warning") || lowerType.includes("outage")) return "#F59E0B"; // Amber
  if (lowerType.includes("water")) return "#3B82F6"; // Blue
  return "#10B981"; // Green
};
