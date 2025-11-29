import React, { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';

// Map Settings
const libraries = ['places'];
const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 250px)", // adjust 120px to whatever space is above the map
  borderRadius: "12px",
};

// VILLAGE'S COORDINATES
const VILLAGE_CENTER = {
  lat: 14.2388, 
  lng: 121.1692
};

const MapManagement = () => {
  const [residents, setResidents] = useState([]);
  const [selectedResident, setSelectedResident] = useState(null);
  const [tempPin, setTempPin] = useState(null);

  // Load the Google Maps Script
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Fetch Residents from Supabase
  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, address_block, address_lot, latitude, longitude')
      .eq('role', 'resident')
      .not('latitude', 'is', null); // Only get users who have a location

    if (error) {
      console.error('Error loading map data:', error);
    } else {
      setResidents(data);
    }
  };

  // Handle Clicking on the Map (To define a new location)
  const onMapClick = useCallback((event) => {
    const newLat = event.latLng.lat();
    const newLng = event.latLng.lng();
    
    setTempPin({ lat: newLat, lng: newLng });
    toast.info(`Selected Location: ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
    
    // Logic to save this to a user would go here (we can do this next)
    console.log("New Pin Coordinates:", { lat: newLat, lng: newLng });
  }, []);

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Village Map...</div>;

  return (
    <div className="relative">
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-4">
        <h2 className="text-lg font-bold text-gray-800">Village Map Overview</h2>
        <p className="text-sm text-gray-500">
          Viewing {residents.length} mapped residents. Click anywhere to test coordinates.
        </p>
      </div>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        zoom={19} // Zoom level
        center={VILLAGE_CENTER}
        onClick={onMapClick}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
        }}
      >
        {/* Render Existing Residents */}
        {residents.map((resident) => (
          <Marker
            key={resident.id}
            position={{ lat: resident.latitude, lng: resident.longitude }}
            onClick={() => setSelectedResident(resident)}
            // custom icon for residents
            icon={{ url: "/resident-icon.svg", scaledSize: new window.google.maps.Size(30, 30) }}
          />
        ))}

        {/* Render Temporary Pin (The one you just clicked) */}
        {tempPin && (
          <Marker
            position={tempPin}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#F59E0B", // Amber color for 'New'
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF",
            }}
          />
        )}

        {/* Info Window (Popup when you click a resident) */}
        {selectedResident && (
          <InfoWindow
            position={{ lat: selectedResident.latitude, lng: selectedResident.longitude }}
            onCloseClick={() => setSelectedResident(null)}
          >
            <div className="min-w-[100px]">
              <h3 className="font-bold text-gray-800">{selectedResident.full_name}</h3>
              <p className="text-sm text-gray-600">
                Blk {selectedResident.address_block} Lot {selectedResident.address_lot}
              </p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
};

export default MapManagement;