import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { Locate, Maximize2 } from "lucide-react";
import { ITrip, ICandidateHospital, ITrafficIncident } from "../types";

// Custom Leaflet Icons using SVG Data URIs to avoid asset bundling bugs
const ambulanceIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center w-10 h-10 bg-red-600 rounded-full border-2 border-white shadow-xl shadow-red-600/50 animate-bounce cursor-pointer">
    <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
  </div>`,
  className: "custom-amb-icon",
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const patientIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center w-9 h-9 bg-amber-500 rounded-full border-2 border-white shadow-xl shadow-amber-500/50 cursor-pointer">
    <span class="text-xs font-black text-slate-950">SOS</span>
  </div>`,
  className: "custom-patient-icon",
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const hospitalIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center w-9 h-9 bg-emerald-600 rounded-full border-2 border-white shadow-xl shadow-emerald-600/50 cursor-pointer">
    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M19 10.5h-5.5V5h-3v5.5H5v3h5.5V19h3v-5.5H19v-3z"/></svg>
  </div>`,
  className: "custom-hosp-icon",
  iconSize: [36, 36],
  iconAnchor: [18, 18]
});

const incidentIcon = L.divIcon({
  html: `<div class="relative flex items-center justify-center w-8 h-8 bg-rose-700 rounded-full border-2 border-white shadow-lg animate-pulse cursor-pointer">
    <span class="text-xs font-bold text-white">!</span>
  </div>`,
  className: "custom-inc-icon",
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

interface MapViewProps {
  trip?: ITrip | null;
  candidateHospitals: ICandidateHospital[];
  incidents: ITrafficIncident[];
  onSelectHospital?: (hospitalId: string) => void;
}

// Controller component to dynamically fit bounds and invalidate size whenever trip or hospitals update
const DynamicMapController: React.FC<{
  trip?: ITrip | null;
  candidateHospitals: ICandidateHospital[];
}> = ({ trip, candidateHospitals }) => {
  const map = useMap();

  useEffect(() => {
    // Invalidate size in case of tab switches
    map.invalidateSize();

    const points: [number, number][] = [];

    if (trip) {
      if (trip.ambulanceLocation?.lat && trip.ambulanceLocation?.lng) {
        points.push([trip.ambulanceLocation.lat, trip.ambulanceLocation.lng]);
      }
      if (trip.patientLocation?.lat && trip.patientLocation?.lng) {
        points.push([trip.patientLocation.lat, trip.patientLocation.lng]);
      }
      if (trip.currentLocation?.lat && trip.currentLocation?.lng) {
        points.push([trip.currentLocation.lat, trip.currentLocation.lng]);
      }
      if (trip.selectedHospital?.lat && trip.selectedHospital?.lng) {
        points.push([trip.selectedHospital.lat, trip.selectedHospital.lng]);
      }
      if (trip.leg1?.waypoints && trip.leg1.waypoints.length > 0) {
        points.push(...trip.leg1.waypoints);
      }
      if (trip.leg2?.waypoints && trip.leg2.waypoints.length > 0) {
        points.push(...trip.leg2.waypoints);
      }
    } else if (candidateHospitals.length > 0) {
      candidateHospitals.forEach((h) => {
        if (h.lat && h.lng) points.push([h.lat, h.lng]);
      });
    }

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, {
        padding: [60, 60],
        maxZoom: 15,
        animate: true
      });
    }
  }, [trip, candidateHospitals, map]);

  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  trip,
  candidateHospitals,
  incidents,
  onSelectHospital
}) => {
  // Center coordinates (default: patient location or Davanagere or Bangalore)
  const defaultCenter: [number, number] = trip
    ? [trip.patientLocation.lat, trip.patientLocation.lng]
    : candidateHospitals.length > 0
    ? [candidateHospitals[0].lat, candidateHospitals[0].lng]
    : [14.4644, 75.9218]; // Davanagere regional default

  const leg1Positions = trip?.leg1?.waypoints || [];
  const leg2Positions = trip?.leg2?.waypoints || [];

  return (
    <div className="relative w-full h-[600px] lg:h-[720px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        doubleClickZoom={true}
        style={{ width: "100%", height: "100%", zIndex: 1 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <DynamicMapController trip={trip} candidateHospitals={candidateHospitals} />

        {/* 1. Ambulance Location Marker */}
        {trip && (
          <Marker
            position={[trip.currentLocation?.lat || trip.ambulanceLocation.lat, trip.currentLocation?.lng || trip.ambulanceLocation.lng]}
            icon={ambulanceIcon}
          >
            <Popup className="text-slate-900">
              <div className="p-1">
                <span className="font-bold text-red-600 block">Ambulance Unit</span>
                <span className="text-xs text-slate-700">{trip.ambulanceLocation.name}</span>
                <span className="text-xs font-semibold block text-slate-900 mt-1">Status: {trip.status}</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Patient Location Marker */}
        {trip && (
          <Marker position={[trip.patientLocation.lat, trip.patientLocation.lng]} icon={patientIcon}>
            <Popup className="text-slate-900">
              <div className="p-1">
                <span className="font-bold text-amber-600 block">Patient Incident</span>
                <span className="text-xs text-slate-700">{trip.patientLocation.name}</span>
                <span className="text-xs bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold block mt-1">
                  {trip.emergencyType} ({trip.severity})
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 3. Candidate Hospitals Markers */}
        {candidateHospitals.map((h) => {
          const isSelected = trip?.selectedHospital?.id === h.id;
          return (
            <Marker key={h.id} position={[h.lat, h.lng]} icon={hospitalIcon}>
              <Popup className="text-slate-900">
                <div className="p-1 max-w-[240px]">
                  <span className="font-bold text-emerald-700 block">{h.name}</span>
                  <span className="text-xs text-slate-600 block">{h.address || "Regional Healthcare Facility"}</span>
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Live Travel Time:</span>
                      <span className="font-bold text-slate-900">{h.travelTimeMinutes} min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Distance:</span>
                      <span className="font-bold text-slate-800">{h.distanceKm} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">ICU Beds Free:</span>
                      <span className="font-bold text-emerald-600">{h.icuBedsAvailable}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Suitability:</span>
                      <span className="font-bold text-blue-600">{h.suitabilityScore}/100</span>
                    </div>
                  </div>
                  {onSelectHospital && !isSelected && (
                    <button
                      onClick={() => onSelectHospital(h.id)}
                      className="mt-2 w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-1 rounded transition"
                    >
                      Route to this Hospital
                    </button>
                  )}
                  {isSelected && (
                    <span className="mt-2 block text-center text-xs bg-emerald-100 text-emerald-800 font-bold py-0.5 rounded">
                      Selected Destination
                    </span>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 4. Active Traffic Incidents */}
        {incidents.map((inc) => (
          <Marker key={inc.id} position={[inc.lat, inc.lng]} icon={incidentIcon}>
            <Popup>
              <div className="p-1">
                <span className="font-bold text-rose-600 block">{inc.severity}</span>
                <span className="text-xs font-semibold text-slate-900">{inc.roadName}</span>
                <p className="text-xs text-slate-600 mt-1">{inc.description}</p>
                <span className="text-xs text-rose-700 block mt-1 font-bold">Delay Factor: {inc.delayFactor}x</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* 5. Leg 1 Polyline (Ambulance -> Patient) */}
        {leg1Positions.length > 1 && (
          <Polyline
            positions={leg1Positions}
            pathOptions={{
              color: "#06B6D4", // Cyan
              weight: 6,
              opacity: 0.85
            }}
          />
        )}

        {/* 6. Leg 2 Polyline (Patient -> Selected Hospital) */}
        {leg2Positions.length > 1 && (
          <Polyline
            positions={leg2Positions}
            pathOptions={{
              color: "#10B981", // Emerald Green
              weight: 6,
              opacity: 0.9,
              dashArray: trip?.activeLeg === "LEG2" ? undefined : "6, 8"
            }}
          />
        )}
      </MapContainer>

      {/* Floating Map Legend & Trip Details Bar */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl flex flex-wrap items-center justify-between gap-3 text-xs z-[1000]">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-1.5 bg-cyan-400 rounded-full inline-block" />
            <span className="text-slate-300 font-medium">Leg 1: Pickup Path</span>
            {trip?.leg1 && (
              <span className="text-cyan-400 font-mono">({trip.leg1.distanceKm} km • {trip.leg1.estimatedDurationMinutes} min)</span>
            )}
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-3.5 h-1.5 bg-emerald-400 rounded-full inline-block" />
            <span className="text-slate-300 font-medium">Leg 2: Hospital Path</span>
            {trip?.leg2 && (
              <span className="text-emerald-400 font-mono">({trip.leg2.distanceKm} km • {trip.leg2.estimatedDurationMinutes} min)</span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3 text-slate-400">
          <span>Congestion:</span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-emerald-400">Clear</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-amber-400">Moderate</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-rose-400">Congested</span>
          </span>
        </div>
      </div>
    </div>
  );
};
