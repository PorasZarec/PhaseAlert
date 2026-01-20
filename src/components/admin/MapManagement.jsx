import React, { useState, useCallback } from "react";
import {
  GoogleMap,
  useLoadScript,
  Marker,
  InfoWindow,
  Polygon,
} from "@react-google-maps/api";
import { supabase } from "../../services/supabaseClient";
import { toast } from "sonner";
import { useResidents } from "../../hooks/useResidents";
import { useMapAlerts } from "../../hooks/useMapAlerts";
import { calculateZonePoints } from "../../lib/geoUtils";

import {
  Save,
  X,
  UserPlus,
  MapIcon,
  BellRing,
  Send,
  CheckSquare,
  Square,
  Users,
  MousePointer2,
  CircleX,
} from "lucide-react";

import Modal from "../shared/Modal";
import {
  ALERT_TYPES,
  VILLAGE_CENTER,
  VILLAGE_BOUNDARY,
} from "../../data/HelperData";

const libraries = ["places"];
const mapContainerStyle = {
  width: "100%",
  height: "calc(100vh - 180px)",
  borderRadius: "12px",
};

const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.("google.maps.Marker is deprecated")) return;
  originalWarn(...args);
};

// --- DYNAMIC SVG PIN ---
// This draws a Google Maps-style pin in any color we want.
const getDynamicPin = (color) => {
  return {
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1.5,
    strokeColor: "#FFFFFF", // White border to make it pop
    scale: 2,
    anchor: new window.google.maps.Point(12, 22), // Anchors the bottom tip of the pin
  };
};

const MapManagement = () => {

	const { createMapAlert, isCreating } = useMapAlerts();

	const {
    residents,
    isLoading: isResidentsLoading,
    updateLocation,
    isUpdating,
  } = useResidents();

  // Computed State
  const mappedResidents = residents.filter((r) => r.latitude && r.longitude);
  const unmappedResidents = residents.filter(
    (r) => !r.latitude || !r.longitude
  );

  // Interaction State
  const [selectedResident, setSelectedResident] = useState(null);
  const [residentToMap, setResidentToMap] = useState(null);
  const [tempPin, setTempPin] = useState(null);

  // Multi-Select & Alert State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertData, setAlertData] = useState({
    title: ALERT_TYPES[0],
    body: "",
    type: "info",
    duration: 24, // Default 24 hours
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // Map Script Loader
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // --- MAP INTERACTIONS ---
  const handleMarkerClick = (resident) => {
    if (isSelectMode) {
      // Toggle Selection
      const newSelected = new Set(selectedIds);
      if (newSelected.has(resident.id)) {
        newSelected.delete(resident.id);
      } else {
        newSelected.add(resident.id);
      }
      setSelectedIds(newSelected);
    } else {
      // Open Info Window
      setSelectedResident(resident);
    }
  };

  const onMapClick = useCallback(
    (event) => {
      // Only allow setting pin if in "Mapping Mode" and NOT in "Select Mode"
      if (residentToMap && !isSelectMode) {
        const newLat = event.latLng.lat();
        const newLng = event.latLng.lng();
        setTempPin({ lat: newLat, lng: newLng });
      }
    },
    [residentToMap, isSelectMode]
  );

  // --- SAVING LOCATION ---
  const handleSaveLocation = () => {
    if (!residentToMap || !tempPin) return;

    updateLocation(
      {
        id: residentToMap.id,
        latitude: tempPin.lat,
        longitude: tempPin.lng,
      },
      {
        onSuccess: () => {
          setResidentToMap(null);
          setTempPin(null);
        },
      }
    );
  };

  // --- ALERT LOGIC ---
  const handleOpenAlertModal = (singleResident = null) => {
        // 1. Check if singleResident is actually a valid user object (and not a Click Event)
        const isResidentObject = singleResident && singleResident.id;

        if (isResidentObject) {
          // If clicked from a specific Pin InfoWindow, force selection to just that user
          setSelectedIds(new Set([singleResident.id]));
        }

        // 2. Reset Form Data (FIXED: Added duration back so it doesn't crash)
        setAlertData({
          title: ALERT_TYPES[0],
          body: "",
          type: "info",
          duration: 24 // <--- THIS WAS MISSING
        });

        setIsAlertModalOpen(true);
      };

  const handleSendAlert = (e) => {
      e.preventDefault();
      if (selectedIds.size === 0) {
        toast.error("No residents selected");
        return;
      }

      // 1. Gather Coordinates
		const selectedResidentsData = residents.filter(r => selectedIds.has(r.id));

		// USE NEW FUNCTION: Just get the dots, don't calculate a shape
  	const affectedArea = calculateZonePoints(selectedResidentsData);

      // ✅ CORRECT: We create a simple array of {lat, lng} objects
      const points = selectedResidentsData.map(r => ({
        lat: Number(r.latitude),  // Ensure these are numbers!
        lng: Number(r.longitude)
      }));

      // 3. Determine Type
      let alertType = "info";
      if (alertData.title.includes("Emergency") || alertData.title.includes("Storm")) alertType = "emergency";
      else if (alertData.title.includes("Outage") || alertData.title.includes("Interruption")) alertType = "warning";

      // CALCULATE EXPIRATION
      const expiresAt = new Date(Date.now() + alertData.duration * 60 * 60 * 1000).toISOString();

      // 4. Send to Backend
      supabase.auth.getUser().then(({ data: { user } }) => {
      createMapAlert({
        title: alertData.title,
        body: alertData.body,
				type: alertType,
        expiresAt: expiresAt,
        affectedArea: affectedArea,
        recipientIds: Array.from(selectedIds),
        senderId: user.id
      }, {
        onSuccess: () => {
          setIsAlertModalOpen(false);
          setSelectedIds(new Set());
          setIsSelectMode(false);
          setSelectedResident(null);
        }
      });
      });
    };

  const cancelMapping = () => {
    setResidentToMap(null);
    setTempPin(null);
  };

  // Helper to determine Modal Variant Color
  const getModalVariant = () => {
    if (
      alertData.title.includes("Emergency") ||
      alertData.title.includes("Storm")
    )
      return "urgent";
    if (
      alertData.title.includes("Outage") ||
      alertData.title.includes("Interruption")
    )
      return "warning";
    return "default";
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading Village Map...</div>;

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
      <div className="relative h-[calc(100vh-10rem)] flex flex-col gap-4">
        {/* --- HEADER --- */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-orange-600" /> Village Map
            </h2>
            <p className="text-sm text-gray-500">
              {residents.length} mapped •{" "}
              <span className="text-orange-600 font-medium">
                {unmappedResidents.length} unmapped
              </span>
            </p>
          </div>

          {/* MAPPING DROPDOWN (Hide if in Select Mode) */}
          {!residentToMap && unmappedResidents.length > 0 && !isSelectMode && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                className="w-full md:w-64 p-2 bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-orange-500"
                onChange={(e) => {
                  const res = unmappedResidents.find(
                    (r) => r.id === e.target.value
                  );
                  if (res) setResidentToMap(res);
                }}
                value=""
              >
                <option value="" disabled>
                  Resident to map...
                </option>
                {unmappedResidents.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SELECT MODE TOGGLE BUTTON */}
          {!residentToMap && (
            <button
              onClick={() => {
                setIsSelectMode(!isSelectMode);
                setSelectedIds(new Set());
                setSelectedResident(null);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
             ${
               isSelectMode
                 ? "bg-amber-600 text-white shadow-md ring-2 ring-orange-300"
                 : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
             }`}
            >
              {isSelectMode ? (
                <CheckSquare className="w-4 h-4" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              {isSelectMode ? "Finish Selection" : "Select Multiple"}
            </button>
          )}
        </div>

        {/* --- THE MAP --- */}
        <div className="relative w-full rounded-xl overflow-hidden shadow-md border border-gray-200">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            zoom={18}
            center={VILLAGE_CENTER}
            onClick={onMapClick}
            options={{
              disableDefaultUI: false,
              streetViewControl: false,
              mapTypeControl: false,
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }],
                },
                // { featureType: "transit", stylers: [{ visibility: "off" }] } sakayan to pare
              ],
              draggableCursor: isSelectMode
                ? "pointer"
                : residentToMap
                ? "crosshair"
                : "grab",
            }}
          >
            <Polygon
              paths={VILLAGE_BOUNDARY}
              options={{
                fillColor: "#ea580c",
                fillOpacity: 0.05,
                strokeColor: "#ea580c",
                strokeOpacity: 0.5,
                strokeWeight: 1,
                clickable: false,
              }}
            />

            {residents.map((resident) => {
              // Force convert to Number.
              const lat = Number(resident.latitude);
              const lng = Number(resident.longitude);

              // If data is corrupt (NaN), skip rendering this pin to prevent crash
							if (isNaN(lat) || isNaN(lng)) return null;

							const isSelected = selectedIds.has(resident.id);

							// NEW: Use SVG Pin instead of PNG
              // Blue if selected, Gray if not.
              // (You can also color them Red here if you want to show active admin alerts, but that requires fetching alerts in this file)
              const pinColor = isSelected ? "#2563EB" : "#374151";

              return (
                <Marker
                  key={resident.id}
                  position={{ lat, lng }}
                  onClick={() => handleMarkerClick(resident)}
                  icon={getDynamicPin(pinColor)} // <--- USE THE SVG FUNCTION
                  animation={isSelected ? window.google.maps.Animation.BOUNCE : null}
                />
              );
            })}

            {tempPin && (
              <Marker
                position={tempPin}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: 8,
                  fillColor: "#F59E0B",
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: "#FFFFFF",
                }}
              />
            )}

            {/* --- INFO WINDOW (Only in Normal Mode) --- */}
            {selectedResident && !isSelectMode && (
              <InfoWindow
                position={{
                  lat: selectedResident.latitude,
                  lng: selectedResident.longitude,
                }}
                onCloseClick={() => setSelectedResident(null)}
              >
                <div className="p-1 min-w-[180px] text-center">
                  <button
                    onClick={() => setSelectedResident(null)}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <CircleX className="w-5 h-5" />
                  </button>

                  <h3 className="font-bold text-gray-900 text-sm">
                    {selectedResident.full_name}
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Blk {selectedResident.address_block} Lot{" "}
                    {selectedResident.address_lot}
                  </p>
                  <button
                    className="w-full flex items-center justify-center gap-2 text-xs bg-red-50 text-red-700 px-3 py-1.5 rounded border border-red-200 hover:bg-red-100 font-medium"
                    onClick={() => handleOpenAlertModal(selectedResident)}
                  >
                    <BellRing className="w-3 h-3" /> Send Alert
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          {/* --- FLOATING DOCK (For Selection Mode) --- */}
          {isSelectMode && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg px-6 py-3 rounded-2xl shadow-2xl border border-gray-200 flex items-center gap-6 z-10">
              {/* Selected Count */}
              <div className="flex items-end gap-1.5 text-blue-900">
                <Users className="w-5 h-5 text-blue-700" />

                <span className="text-xl font-bold leading-none">
                  {selectedIds.size}
                </span>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-gray-600" />

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="
                  px-3 py-2 text-xs font-medium
                  text-gray-600 bg-gray-100
                  hover:bg-gray-200 hover:text-gray-700
                  rounded-lg transition
                "
                >
                  Clear
                </button>

                <button
                	onClick={() => handleOpenAlertModal(null)}
                  disabled={selectedIds.size === 0}
                  className="
                  flex items-center gap-2 px-4 py-2
                  bg-red-600 hover:bg-red-700
                  text-white text-xs font-bold rounded-full
                  shadow-lg shadow-red-500/30
                  disabled:opacity-40 disabled:hover:bg-red-600
                  disabled:shadow-none transition-all
                "
                >
                  <Send className="w-3 h-3" />
                  ALERT
                </button>
              </div>
            </div>
          )}

          {/* --- MAPPING OVERLAY --- */}
          {residentToMap && (
            <div className="absolute bottom-4 left-4 right-4 w-auto max-w-xs bg-white p-4 rounded-xl shadow-xl border border-orange-100 z-10">
              <div className="flex items-center justify-between mb-2">
                {/* Left icon */}
                <div className="bg-orange-100 p-1.5 md:p-2 rounded-full text-orange-600">
                  <UserPlus size={18} />
                </div>

                {/* Centered title */}
                <div className="text-center flex-1 flex justify-center">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-semibold uppercase">
                      Mapping:
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {residentToMap.full_name}
                    </span>
                  </div>
                </div>

                {/* Close button */}
                <button
                  onClick={() => {
                    setResidentToMap(null);
                    setTempPin(null);
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                {tempPin
                  ? "Location selected! Click save to finish."
                  : "Tap anywhere on the map to set location."}
              </p>

              {/* Save and Cancel Button */}
              <div className="flex gap-2">
                <button
                  onClick={handleSaveLocation}
                  disabled={!tempPin || isProcessing}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-3 md:px-4 rounded-lg flex items-center justify-center gap-1.5 md:gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
                >
                  <Save size={16} className="md:w-[18px] md:h-[18px]" />{" "}
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

        {/* --- MODAL --- */}
        <Modal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          title={
            <span className="flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              {selectedIds.size > 1
                ? `Broadcast to ${selectedIds.size} Residents`
                : "Send Alert"}
            </span>
          }
          variant={getModalVariant()} // DYNAMIC RED HEADER!
        >
          <form onSubmit={handleSendAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alert Type
              </label>
              <select
                value={alertData.title}
                onChange={(e) =>
                  setAlertData({
                    ...alertData,
                    title: e.target.value,
                  })
                }
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {ALERT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message Body
              </label>
              <textarea
                required
                rows={4}
                value={alertData.body}
                onChange={(e) =>
                  setAlertData({
                    ...alertData,
                    body: e.target.value,
                  })
                }
                placeholder="Details about this alert..."
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
						</div>

						{/* Expiration */}
						<div>
						  <label className="block text-sm font-medium text-gray-700 mb-1">
						    Duration
						  </label>
						  <select
						    value={alertData.duration}
						    onChange={(e) => setAlertData({ ...alertData, duration: Number(e.target.value) })}
						    className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
						  >
						    {/* --- DEMO OPTIONS --- */}
						    <option value={0.0167}>1 Minute (Demo)</option>
						    <option value={0.0833}>5 Minutes (Demo)</option>

						    {/* --- STANDARD OPTIONS --- */}
						    <option value={1}>1 Hour (Quick Update)</option>
						    <option value={6}>6 Hours</option>
						    <option value={12}>12 Hours</option>
						    <option value={24}>24 Hours (1 Day)</option>
						    <option value={72}>3 Days (Storm/Event)</option>
						  </select>
						</div>

						<div className="pt-2">
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {isProcessing ? "Sending..." : "CONFIRM & SEND"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default MapManagement;
