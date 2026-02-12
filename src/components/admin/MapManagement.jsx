import React, { useState, useCallback, useMemo } from "react";
// REMOVED: useLoadScript import
import { GoogleMap, Marker, InfoWindow, Polygon, Circle } from "@react-google-maps/api";
import { supabase } from "../../services/supabaseClient";
import { toast } from "sonner";
import { useResidents } from "../../hooks/useResidents";
import { useMapAlerts } from "../../hooks/useMapAlerts";
import { calculateZonePoints, getZoneColor } from "../../lib/geoUtils";
import { Save, X, UserPlus, MapIcon, BellRing, Send, CheckSquare, Square, Users, CircleX } from "lucide-react";
import Modal from "../shared/Modal";
import { ALERT_TYPES, VILLAGE_CENTER, VILLAGE_BOUNDARY } from "../../data/HelperData";

const mapContainerStyle = { width: "100%", height: "calc(100vh - 180px)", borderRadius: "12px" };

// Suppress deprecated warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.("google.maps.Marker is deprecated")) return;
  originalWarn(...args);
};

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

const MapManagement = () => {
  const { createMapAlert, activeZones } = useMapAlerts();
  const { residents, updateLocation } = useResidents();

  const mappedResidents = residents.filter((r) => r.latitude && r.longitude);
  const unmappedResidents = residents.filter((r) => !r.latitude || !r.longitude);

  const [selectedResident, setSelectedResident] = useState(null);
  const [residentToMap, setResidentToMap] = useState(null);
  const [tempPin, setTempPin] = useState(null);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [alertData, setAlertData] = useState({ title: ALERT_TYPES[0], body: "", type: "info", duration: 24 });
  const [isProcessing, setIsProcessing] = useState(false);

  // REMOVED: useLoadScript hook block entirely.
  // The parent component (AdminDashboard) now wraps this in <GoogleMapsLoader>

  const uniqueCircles = useMemo(() => {
    if (!activeZones) return [];
    const locationMap = new Map();
    const severityScore = { emergency: 4, warning: 3, info: 2, default: 1 };

    activeZones.forEach((alert) => {
      let score = 1;
      const lower = (alert.category || "").toLowerCase();
      if (lower.includes("emergency")) score = 4;
      else if (lower.includes("outage")) score = 3;

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

  const getResidentPinColor = (residentId) => {
    if (selectedIds.has(residentId)) return "#2563EB";
    if (!activeZones) return "#374151";
    const relevantAlerts = activeZones.filter(a => a.recipient_ids?.includes(residentId));
    if (relevantAlerts.length === 0) return "#374151";
    return getZoneColor(relevantAlerts[0].category);
  };

  const handleMarkerClick = (resident) => {
    if (isSelectMode) {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(resident.id)) newSelected.delete(resident.id);
      else newSelected.add(resident.id);
      setSelectedIds(newSelected);
    } else {
      setSelectedResident(resident);
    }
  };

  const onMapClick = useCallback((event) => {
    if (residentToMap && !isSelectMode) {
      setTempPin({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    }
  }, [residentToMap, isSelectMode]);

  const handleSaveLocation = () => {
    if (!residentToMap || !tempPin) return;
    updateLocation({ id: residentToMap.id, latitude: tempPin.lat, longitude: tempPin.lng }, {
      onSuccess: () => {
        setResidentToMap(null);
        setTempPin(null);
      },
    });
  };

  const handleOpenAlertModal = (singleResident = null) => {
    if (singleResident && singleResident.id) {
      setSelectedIds(new Set([singleResident.id]));
    }
    setAlertData({ title: ALERT_TYPES[0], body: "", type: "info", duration: 24 });
    setIsAlertModalOpen(true);
  };

  const handleSendAlert = (e) => {
    e.preventDefault();
    if (selectedIds.size === 0) return toast.error("No residents selected");

    const selectedResidentsData = residents.filter(r => selectedIds.has(r.id));
    const affectedArea = calculateZonePoints(selectedResidentsData);

    const expiresAt = new Date(Date.now() + alertData.duration * 60 * 60 * 1000).toISOString();
    const finalCategory = alertData.title;

    setIsProcessing(true); // Add loading state
    supabase.auth.getUser().then(({ data: { user } }) => {
      createMapAlert({
        title: alertData.title,
        body: alertData.body,
        type: finalCategory,
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
          setIsProcessing(false);
        },
        onError: () => setIsProcessing(false)
      });
    });
  };

  const getModalVariant = () => {
    const t = alertData.title.toLowerCase();
    if (t.includes("emergency") || t.includes("storm")) return "urgent";
    if (t.includes("outage")) return "warning";
    return "default";
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm text-center">
      <div className="relative h-[calc(100vh-10rem)] flex flex-col gap-4">
        {/* Header & Controls */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MapIcon className="w-5 h-5 text-orange-600" /> Village Map
            </h2>
            <p className="text-sm text-gray-500">
              {residents.length} mapped • <span className="text-orange-600 font-medium">{unmappedResidents.length} unmapped</span>
            </p>
          </div>

          {!residentToMap && unmappedResidents.length > 0 && !isSelectMode && (
            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                className="w-full md:w-64 p-2 bg-gray-50 border border-gray-300 text-sm rounded-lg focus:ring-orange-500"
                onChange={(e) => setResidentToMap(unmappedResidents.find((r) => r.id === e.target.value))}
                value=""
              >
                <option value="" disabled>Resident to map...</option>
                {unmappedResidents.map((r) => <option key={r.id} value={r.id}>{r.full_name}</option>)}
              </select>
            </div>
          )}

          {!residentToMap && (
            <button
              onClick={() => { setIsSelectMode(!isSelectMode); setSelectedIds(new Set()); setSelectedResident(null); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSelectMode ? "bg-amber-600 text-white shadow-md" : "bg-white border border-gray-300 hover:bg-gray-50"}`}
            >
              {isSelectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {isSelectMode ? "Finish Selection" : "Select Multiple"}
            </button>
          )}
        </div>

        {/* Map Container */}
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
              styles: [{ featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }],
              draggableCursor: isSelectMode ? "pointer" : residentToMap ? "crosshair" : "grab",
            }}
          >
            <Polygon
              paths={VILLAGE_BOUNDARY}
              options={{ fillColor: "#ea580c", fillOpacity: 0.05, strokeColor: "#ea580c", strokeOpacity: 0.5, strokeWeight: 1, clickable: false }}
            />

            {/* Active Alert Zones */}
            {uniqueCircles.map((item, index) => (
              <Circle
                key={`circle-${index}`}
                center={item.point}
                radius={25}
                options={{
                  fillColor: item.color,
                  fillOpacity: 0.2,
                  strokeColor: item.color,
                  strokeWeight: 1,
                  clickable: false,
                }}
              />
            ))}

            {residents.map((resident) => {
              const lat = Number(resident.latitude);
              const lng = Number(resident.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;

              const isSelected = selectedIds.has(resident.id);
              const pinColor = getResidentPinColor(resident.id);

              return (
                <Marker
                  key={resident.id}
                  position={{ lat, lng }}
                  onClick={() => handleMarkerClick(resident)}
                  icon={getDynamicPin(pinColor)}
                  animation={isSelected ? window.google.maps.Animation.BOUNCE : null}
                />
              );
            })}

            {tempPin && (
              <Marker
                position={tempPin}
                icon={{ path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#F59E0B", fillOpacity: 1, strokeWeight: 2, strokeColor: "#FFFFFF" }}
              />
            )}

            {selectedResident && !isSelectMode && (
              <InfoWindow
                position={{ lat: selectedResident.latitude, lng: selectedResident.longitude }}
                onCloseClick={() => setSelectedResident(null)}
              >
                <div className="p-1 min-w-[180px] text-center">
                  <button onClick={() => setSelectedResident(null)} className="absolute right-2 top-2 text-gray-400 hover:text-gray-600">
                    <CircleX className="w-5 h-5" />
                  </button>
                  <h3 className="font-bold text-gray-900 text-sm">{selectedResident.full_name}</h3>
                  <p className="text-xs text-gray-500 mb-2">Blk {selectedResident.address_block} Lot {selectedResident.address_lot}</p>
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

          {/* Selection Dock & Overlays... (Kept same as original, just truncated here for brevity) */}
          {isSelectMode && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-lg px-6 py-3 rounded-2xl shadow-2xl border border-gray-200 flex items-center gap-6 z-10">
              <div className="flex items-end gap-1.5 text-blue-900">
                <Users className="w-5 h-5 text-blue-700" />
                <span className="text-xl font-bold leading-none">{selectedIds.size}</span>
              </div>
              <div className="h-6 w-px bg-gray-600" />
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg">Clear</button>
                <button
                  onClick={() => handleOpenAlertModal(null)}
                  disabled={selectedIds.size === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-full shadow-lg disabled:opacity-40"
                >
                  <Send className="w-3 h-3" /> ALERT
                </button>
              </div>
            </div>
          )}

          {residentToMap && (
             <div className="absolute bottom-4 left-4 right-4 w-auto max-w-xs bg-white p-4 rounded-xl shadow-xl border border-orange-100 z-10">
              <div className="flex items-center justify-between mb-2">
                <div className="bg-orange-100 p-1.5 rounded-full text-orange-600"><UserPlus size={18} /></div>
                <div className="text-center flex-1">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Mapping: </span>
                  <span className="text-sm font-bold text-gray-900">{residentToMap.full_name}</span>
                </div>
                <button onClick={() => { setResidentToMap(null); setTempPin(null); }}><X size={16} /></button>
              </div>
              <p className="text-xs text-gray-500 mb-3">{tempPin ? "Location selected! Click save to finish." : "Tap anywhere on the map to set location."}</p>
              <div className="flex gap-2">
                <button onClick={handleSaveLocation} disabled={!tempPin || isProcessing} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-sm disabled:opacity-50">
                  <Save size={16} /> {isProcessing ? "Saving..." : "Save"}
                </button>
                <button onClick={() => { setResidentToMap(null); setTempPin(null); }} className="px-3 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Logic (Unchanged) */}
        <Modal
          isOpen={isAlertModalOpen}
          onClose={() => setIsAlertModalOpen(false)}
          title={<span className="flex items-center gap-2"><BellRing className="w-5 h-5" /> {selectedIds.size > 1 ? `Broadcast to ${selectedIds.size} Residents` : "Send Alert"}</span>}
          variant={getModalVariant()}
        >
          <form onSubmit={handleSendAlert} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alert Type</label>
              <select
                value={alertData.title}
                onChange={(e) => setAlertData({ ...alertData, title: e.target.value })}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                {ALERT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message Body</label>
              <textarea
                required
                rows={4}
                value={alertData.body}
                onChange={(e) => setAlertData({ ...alertData, body: e.target.value })}
                placeholder="Details about this alert..."
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
              <select
                value={alertData.duration}
                onChange={(e) => setAlertData({ ...alertData, duration: Number(e.target.value) })}
                className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-red-500 bg-white"
              >
                <option value={0.0167}>1 Minute (Demo)</option>
                <option value={0.0833}>5 Minutes (Demo)</option>
                <option value={1}>1 Hour (Quick Update)</option>
                <option value={6}>6 Hours</option>
                <option value={12}>12 Hours</option>
                <option value={24}>24 Hours (1 Day)</option>
                <option value={72}>3 Days (Storm/Event)</option>
              </select>
            </div>
            <div className="pt-2">
              <button type="submit" disabled={isProcessing} className="w-full py-3 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition shadow-lg flex items-center justify-center gap-2">
                <Send className="w-4 h-4" /> {isProcessing ? "Sending..." : "CONFIRM & SEND"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default MapManagement;
