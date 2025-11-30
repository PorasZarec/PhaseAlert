import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow, Polygon } from '@react-google-maps/api';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import { Save, X, UserPlus, Map as MapIcon } from 'lucide-react'; // Assuming you have lucide-react

// --- MAP SETTINGS ---
const libraries = ['places'];
const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 200px)", // Adjusted height for mobile
  borderRadius: "12px",
};

const VILLAGE_CENTER = { lat: 14.2388, lng: 121.1692 };

// 1. BOUNDARY COORDINATES (From your request)
const VILLAGE_BOUNDARY = [
  { lat: 14.2393, lng: 121.1695 },
  { lat: 14.2385, lng: 121.1698 },
  { lat: 14.2382, lng: 121.1689 },
  { lat: 14.2390, lng: 121.1686 }
];

// 2. MAP STYLES (Hides default POIs like businesses)
const mapOptions = {
  disableDefaultUI: false,
  streetViewControl: false,
  mapTypeControl: false,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }], // This hides the default pins
    },
    {
      featureType: "transit",
      stylers: [{ visibility: "off" }],
    }
  ]
};

const MapManagement = () => {
  const [residents, setResidents] = useState([]); // Mapped residents
  const [unmappedResidents, setUnmappedResidents] = useState([]); // Residents with NO location
  const [selectedResident, setSelectedResident] = useState(null); // For viewing info
  
  // Mapping Mode State
  const [residentToMap, setResidentToMap] = useState(null); // The user we are currently trying to pin
  const [tempPin, setTempPin] = useState(null); // Where we clicked
  const [isProcessing, setIsProcessing] = useState(false);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, address_block, address_lot, latitude, longitude')
      .eq('role', 'resident');

    if (error) {
      console.error('Error loading map data:', error);
      toast.error("Failed to load data");
    } else {
      // Separate mapped vs unmapped
      const mapped = data.filter(r => r.latitude && r.longitude);
      const unmapped = data.filter(r => !r.latitude || !r.longitude);
      
      setResidents(mapped);
      setUnmappedResidents(unmapped);
    }
  };

  const onMapClick = useCallback((event) => {
    // We only care about clicks if we are trying to map a specific resident
    if (!residentToMap) return;

    const newLat = event.latLng.lat();
    const newLng = event.latLng.lng();
    
    setTempPin({ lat: newLat, lng: newLng });
  }, [residentToMap]);

  const handleSaveLocation = async () => {
    if (!residentToMap || !tempPin) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ latitude: tempPin.lat, longitude: tempPin.lng })
        .eq('id', residentToMap.id);

      if (error) throw error;

      toast.success(`Location set for ${residentToMap.full_name}`);
      
      // Refresh local state without refetching API
      setResidents([...residents, { ...residentToMap, latitude: tempPin.lat, longitude: tempPin.lng }]);
      setUnmappedResidents(unmappedResidents.filter(r => r.id !== residentToMap.id));
      
      // Reset modes
      setResidentToMap(null);
      setTempPin(null);
    } catch (error) {
      toast.error('Error saving location');
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelMapping = () => {
    setResidentToMap(null);
    setTempPin(null);
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Village Map...</div>;

  return (
    <div className="relative h-full flex flex-col gap-4">
      
      {/* --- ACTION HEADER --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-orange-600"/> Village Map
          </h2>
          <p className="text-sm text-gray-500">
            {residents.length} mapped • <span className="text-orange-600 font-medium">{unmappedResidents.length} unmapped</span>
          </p>
        </div>

        {/* Dropdown to Select Unmapped Resident */}
        {!residentToMap && unmappedResidents.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
             <select 
               className="w-full md:w-64 p-2.5 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-orange-500 focus:border-orange-500"
               onChange={(e) => {
                 const res = unmappedResidents.find(r => r.id === e.target.value);
                 if(res) setResidentToMap(res);
               }}
               value=""
             >
               <option value="" disabled>Select resident to map...</option>
               {unmappedResidents.map(r => (
                 <option key={r.id} value={r.id}>
                   {r.full_name} (Blk {r.address_block} Lot {r.address_lot})
                 </option>
               ))}
             </select>
          </div>
        )}
      </div>

      {/* --- THE MAP --- */}
      <div className="relative w-full rounded-xl overflow-hidden shadow-md border border-gray-200">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          zoom={19}
          center={VILLAGE_CENTER}
          onClick={onMapClick}
          options={mapOptions}
        >
          {/* 1. The Village Boundary Box */}
          <Polygon
            paths={VILLAGE_BOUNDARY}
            options={{
              fillColor: "#ea580c", // Orange-600 of tailwind 
              fillOpacity: 0.1,
              strokeColor: "#ea580c",
              strokeOpacity: 0.8,
              strokeWeight: 2,
              clickable: false, 
              // Optional: Disable dragging/editing to be safe
              draggable: false, 
              editable: false 
            }}
          />

          {/* 2. Existing Residents */}
          {residents.map((resident) => (
            <Marker
              key={resident.id}
              position={{ lat: resident.latitude, lng: resident.longitude }}
              onClick={() => setSelectedResident(resident)}
              icon={{ url: "/black-pin.png", scaledSize: new window.google.maps.Size(23, 30) }}
            />
          ))}

          {/* 3. Temporary Pin (While Mapping) */}
          {tempPin && (
            <Marker
              position={tempPin}
              animation={window.google.maps.Animation.DROP}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#F59E0B",
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#FFFFFF",
              }}
            />
          )}

          {/* Info Window */}
          {selectedResident && (
            <InfoWindow
              position={{ lat: selectedResident.latitude, lng: selectedResident.longitude }}
              onCloseClick={() => setSelectedResident(null)}
            >
              <div className="relative min-w-[170px] p-1 pt-0 text-center">
            
                {/* Custom Close Button */}
                <button 
                  onClick={() => setSelectedResident(null)}
                  className="absolute right-1 -top-px text-gray-400 hover:text-gray-600 transition"
                >
                  ✕
                </button>
            
                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-sm leading-tight">
                  {selectedResident.full_name}
                </h3>
            
                {/* Address */}
                <p className="text-xs text-gray-600 mt-1 mb-3">
                  Blk {selectedResident.address_block} • Lot {selectedResident.address_lot}
                </p>
            
                {/* Button */}
                <button
                  className="text-xs bg-orange-50 text-orange-700 px-3 py-2 rounded-lg w-full 
                            border border-orange-200 hover:bg-orange-100 transition"
                  onClick={() => alert("Navigate to profile or edit")}
                >
                  View Details
                </button>
              </div>
            </InfoWindow>
            )}
          </GoogleMap>

          {/* --- MAPPING OVERLAY --- */}
          {residentToMap && (
            <div className="absolute bottom-3 left-3 right-3 md:bottom-4 md:left-4 md:right-auto md:w-80 lg:w-96 bg-white p-3 md:p-4 rounded-lg md:rounded-xl shadow-xl border border-orange-100 z-10 animate-in slide-in-from-bottom-5 duration-1000">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="bg-orange-100 p-1.5 md:p-2 rounded-full text-orange-600 flex-shrink-0">
                    <UserPlus size={18} className="md:w-5 md:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wide">Mapping</p>
                    <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">{residentToMap.full_name}</h3>
                  </div>
                </div>
                <button onClick={cancelMapping} className="text-gray-400 hover:text-gray-600 flex-shrink-0 ml-2">
                  <X size={18} className="md:w-5 md:h-5" />
                </button>
              </div>
              
              <p className="text-xs md:text-sm text-gray-600 mb-3">
                {tempPin 
                  ? "Location selected! Click save to finish." 
                  : "Tap anywhere on the map to set location."}
              </p>

              <div className="flex gap-2">
                <button 
                  onClick={handleSaveLocation}
                  disabled={!tempPin || isProcessing}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  <Save size={16} className="md:w-[18px] md:h-[18px]" />
                  {isProcessing ? "Saving..." : "Save"}
                </button>
              <button 
                onClick={cancelMapping}
                className="px-3 md:px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapManagement;