import React, { useState } from "react";
import { X, Siren, MapPin, AlertCircle, Compass, Search, Loader2 } from "lucide-react";
import { api } from "../services/api";

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    emergencyType: string;
    severity: string;
    callerNotes: string;
    ambulanceLocation: { name: string; lat: number; lng: number };
    patientLocation: { name: string; lat: number; lng: number };
  }) => void;
}

export const DispatchModal: React.FC<DispatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [emergencyType, setEmergencyType] = useState("Cardiac Arrest");
  const [severity, setSeverity] = useState("CRITICAL");
  const [callerNotes, setCallerNotes] = useState("Elderly patient with severe acute chest pain and breathing difficulty");

  // Ambulance
  const [ambName, setAmbName] = useState("MG Road Metro Station, Bengaluru");
  const [ambLat, setAmbLat] = useState(12.9756);
  const [ambLng, setAmbLng] = useState(77.6066);
  const [isGeocodingAmb, setIsGeocodingAmb] = useState(false);

  // Patient
  const [patName, setPatName] = useState("100 Feet Road, Indiranagar, Bengaluru");
  const [patLat, setPatLat] = useState(12.9784);
  const [patLng, setPatLng] = useState(77.6408);
  const [isGeocodingPat, setIsGeocodingPat] = useState(false);

  // Error popup
  const [popupError, setPopupError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleApplyBengaluruPreset = () => {
    setAmbName("MG Road Metro Station, Bengaluru");
    setAmbLat(12.9756);
    setAmbLng(77.6066);

    setPatName("100 Feet Road, Indiranagar, Bengaluru");
    setPatLat(12.9784);
    setPatLng(77.6408);

    setEmergencyType("Cardiac Arrest");
    setSeverity("CRITICAL");
  };

  const handleApplyDavanagerePreset = () => {
    setAmbName("GMIT Campus Ambulance Station, Davanagere");
    setAmbLat(14.4644);
    setAmbLng(75.9218);

    setPatName("Hadadi Road Circle, Davanagere");
    setPatLat(14.4580);
    setPatLng(75.9150);

    setEmergencyType("Severe Trauma");
    setSeverity("CRITICAL");
  };

  const geocodeLocation = async (query: string, isAmbulance: boolean) => {
    if (!query.trim()) {
      setPopupError("Location unavailable");
      return false;
    }
    if (isAmbulance) setIsGeocodingAmb(true);
    else setIsGeocodingPat(true);

    try {
      const res = await api.geocode(query);
      if (!res.success || !res.location) {
        setPopupError("Location unavailable");
        return false;
      }
      if (isAmbulance) {
        setAmbLat(res.location.lat);
        setAmbLng(res.location.lng);
        setAmbName(res.location.name);
      } else {
        setPatLat(res.location.lat);
        setPatLng(res.location.lng);
        setPatName(res.location.name);
      }
      return true;
    } catch {
      setPopupError("Location unavailable");
      return false;
    } finally {
      if (isAmbulance) setIsGeocodingAmb(false);
      else setIsGeocodingPat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verify ambulance coordinates exist or attempt geocode
    let currentAmbLat = ambLat;
    let currentAmbLng = ambLng;
    let currentAmbName = ambName;

    if (!currentAmbLat || !currentAmbLng || isNaN(currentAmbLat) || isNaN(currentAmbLng)) {
      const ambOk = await geocodeLocation(ambName, true);
      if (!ambOk) return;
    }

    // Verify patient coordinates exist or attempt geocode
    let currentPatLat = patLat;
    let currentPatLng = patLng;
    let currentPatName = patName;

    if (!currentPatLat || !currentPatLng || isNaN(currentPatLat) || isNaN(currentPatLng)) {
      const patOk = await geocodeLocation(patName, false);
      if (!patOk) return;
    }

    onSubmit({
      emergencyType,
      severity,
      callerNotes,
      ambulanceLocation: { name: currentAmbName, lat: currentAmbLat, lng: currentAmbLng },
      patientLocation: { name: currentPatName, lat: currentPatLat, lng: currentPatLng }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative">
        {/* Error Popup Message */}
        {popupError && (
          <div className="absolute inset-0 z-50 bg-black/85 flex items-center justify-center p-6 animate-fadeIn">
            <div className="bg-slate-900 border-2 border-red-500 rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
              <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Location Unavailable</h3>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                The specified location could not be resolved in the regional geospatial index. Please enter a valid address, landmark (e.g. Davanagere, GMIT, Indiranagar, PB Road), or manually specify coordinates.
              </p>
              <button
                type="button"
                onClick={() => setPopupError(null)}
                className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm transition"
              >
                Dismiss & Modify Location
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-red-950/80 border-b border-red-900/60 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Siren className="w-6 h-6 text-red-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white">Emergency Dispatch Intake</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Selector */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium">Quick Regional Presets:</span>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={handleApplyDavanagerePreset}
              className="px-3 py-1 bg-blue-900/50 hover:bg-blue-800/60 text-blue-300 border border-blue-700/50 rounded-lg transition"
            >
              Davanagere (GMIT Regional Corridor)
            </button>
            <button
              type="button"
              onClick={handleApplyBengaluruPreset}
              className="px-3 py-1 bg-red-900/50 hover:bg-red-800/60 text-red-300 border border-red-700/50 rounded-lg transition"
            >
              Bengaluru (MG Rd → Indiranagar)
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Emergency Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Category</label>
              <select
                value={emergencyType}
                onChange={(e) => setEmergencyType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500"
              >
                <option value="Cardiac Arrest">Cardiac Arrest (Requires Cath Lab)</option>
                <option value="Severe Trauma">Severe Trauma / Accident (Level 1 Trauma)</option>
                <option value="Stroke">Stroke / Neurological (Stroke Unit)</option>
                <option value="Respiratory Distress">Respiratory Distress</option>
                <option value="Obstetric">Obstetric / Neonatal</option>
                <option value="General">General Medical Emergency</option>
              </select>
            </div>

            {/* Severity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Clinical Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 font-semibold text-red-400"
              >
                <option value="CRITICAL">CRITICAL (Golden Hour Immediate Priority)</option>
                <option value="HIGH">HIGH (Urgent Dispatch)</option>
                <option value="MODERATE">MODERATE</option>
                <option value="LOW">LOW</option>
              </select>
            </div>
          </div>

          {/* Location 1: Ambulance Station */}
          <div className="p-3.5 bg-slate-800/50 border border-slate-700/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-red-400">
                <Compass className="w-4 h-4" />
                <span>Location 1: Ambulance Origin</span>
              </div>
              <button
                type="button"
                onClick={() => geocodeLocation(ambName, true)}
                disabled={isGeocodingAmb}
                className="flex items-center space-x-1 text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded transition"
              >
                {isGeocodingAmb ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                <span>Locate Address</span>
              </button>
            </div>
            <input
              type="text"
              value={ambName}
              onChange={(e) => setAmbName(e.target.value)}
              onBlur={() => {
                if (ambName.trim() && (!ambLat || !ambLng)) {
                  geocodeLocation(ambName, true);
                }
              }}
              placeholder="Ambulance Station Name / Address (e.g. GMIT Campus, Davanagere)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Lat:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={ambLat}
                  onChange={(e) => setAmbLat(parseFloat(e.target.value))}
                  className="bg-transparent text-slate-300 font-mono w-full focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Lng:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={ambLng}
                  onChange={(e) => setAmbLng(parseFloat(e.target.value))}
                  className="bg-transparent text-slate-300 font-mono w-full focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Location 2: Patient Pickup Location */}
          <div className="p-3.5 bg-slate-800/50 border border-slate-700/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-400">
                <MapPin className="w-4 h-4" />
                <span>Location 2: Patient Incident Location</span>
              </div>
              <button
                type="button"
                onClick={() => geocodeLocation(patName, false)}
                disabled={isGeocodingPat}
                className="flex items-center space-x-1 text-[11px] bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-0.5 rounded transition"
              >
                {isGeocodingPat ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
                <span>Locate Address</span>
              </button>
            </div>
            <input
              type="text"
              value={patName}
              onChange={(e) => setPatName(e.target.value)}
              onBlur={() => {
                if (patName.trim() && (!patLat || !patLng)) {
                  geocodeLocation(patName, false);
                }
              }}
              placeholder="Patient Address / Landmark (e.g. Hadadi Road, Davanagere)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
            />
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Lat:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={patLat}
                  onChange={(e) => setPatLat(parseFloat(e.target.value))}
                  className="bg-transparent text-slate-300 font-mono w-full focus:outline-none"
                />
              </div>
              <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded px-2 py-1">
                <span className="text-[10px] text-slate-500 uppercase font-mono">Lng:</span>
                <input
                  type="number"
                  step="0.0001"
                  value={patLng}
                  onChange={(e) => setPatLng(parseFloat(e.target.value))}
                  className="bg-transparent text-slate-300 font-mono w-full focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Caller Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Caller & Dispatch Notes</label>
            <textarea
              rows={2}
              value={callerNotes}
              onChange={(e) => setCallerNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
            />
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-red-600/40 transition flex items-center space-x-2"
            >
              <Siren className="w-4 h-4" />
              <span>Calculate Dual-Leg Emergency Mission</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
