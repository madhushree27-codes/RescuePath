import React, { useState, useEffect } from "react";
import { AlertTriangle, Plus, Trash2, ShieldAlert, Zap, Globe, Sparkles } from "lucide-react";
import { ITrafficIncident, ITrip } from "../types";
import { api } from "../services/api";

interface TrafficControlProps {
  incidents: ITrafficIncident[];
  activeTrip?: ITrip | null;
  onAddIncident: (incident: {
    roadName: string;
    severity: string;
    delayFactor: number;
    description: string;
    lat: number;
    lng: number;
  }) => void;
  onRemoveIncident: (id: string) => void;
}

export const TrafficControl: React.FC<TrafficControlProps> = ({
  incidents,
  activeTrip,
  onAddIncident,
  onRemoveIncident
}) => {
  const [providerStatus, setProviderStatus] = useState<any>(null);

  // Defaults adapt to active trip or Davanagere
  const initialRoad = activeTrip?.leg1?.segments?.[0]?.roadName || "Hadadi Road";
  const initialLat = activeTrip?.patientLocation?.lat || 14.4580;
  const initialLng = activeTrip?.patientLocation?.lng || 75.9150;

  const [roadName, setRoadName] = useState(initialRoad);
  const [severity, setSeverity] = useState("HEAVY_CONGESTION");
  const [delayFactor, setDelayFactor] = useState(3.5);
  const [description, setDescription] = useState("Severe traffic gridlock obstructing emergency corridor");
  const [lat, setLat] = useState(initialLat);
  const [lng, setLng] = useState(initialLng);

  useEffect(() => {
    api.getTrafficProviderStatus().then(setProviderStatus).catch(() => {});
  }, []);

  // Update fields if active trip changes
  useEffect(() => {
    if (activeTrip) {
      const activeRoute = activeTrip.activeLeg === "LEG1" ? activeTrip.leg1 : activeTrip.leg2;
      const rName = activeRoute?.segments?.[0]?.roadName || activeTrip.patientLocation.name;
      setRoadName(rName);
      setLat(activeTrip.patientLocation.lat);
      setLng(activeTrip.patientLocation.lng);
      setDescription(`Heavy congestion on ${rName} obstructing ambulance response`);
    }
  }, [activeTrip?.id, activeTrip?.activeLeg]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddIncident({
      roadName,
      severity,
      delayFactor,
      description,
      lat,
      lng
    });
  };

  const handleQuickActiveRouteJam = () => {
    if (!activeTrip) return;
    const activeRoute = activeTrip.activeLeg === "LEG1" ? activeTrip.leg1 : activeTrip.leg2;
    const rName = activeRoute?.segments?.[0]?.roadName || activeTrip.patientLocation.name;
    setRoadName(rName);
    setSeverity("COMPLETE_BLOCK");
    setDelayFactor(4.0);
    setDescription(`Major accident on ${rName} directly on active dispatch corridor`);
    setLat(activeTrip.patientLocation.lat);
    setLng(activeTrip.patientLocation.lng);
  };

  const handleQuickDavanagereHadadiJam = () => {
    setRoadName("Hadadi Road");
    setSeverity("HEAVY_CONGESTION");
    setDelayFactor(3.5);
    setDescription("Severe bottleneck on Hadadi Road toward GMIT circle");
    setLat(14.4580);
    setLng(75.9150);
  };

  const handleQuickDavanagerePBJam = () => {
    setRoadName("PB Road (Old NH-4)");
    setSeverity("HEAVY_CONGESTION");
    setDelayFactor(3.2);
    setDescription("Heavy commercial congestion on PB Road near City Center");
    setLat(14.4670);
    setLng(75.9220);
  };

  const handleQuickOldAirportRoadJam = () => {
    setRoadName("Old Airport Road");
    setSeverity("HEAVY_CONGESTION");
    setDelayFactor(3.8);
    setDescription("Severe gridlock on Old Airport Road near Domlur");
    setLat(12.9608);
    setLng(77.6415);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-purple-600/20 border border-purple-500/40 rounded-2xl text-purple-400">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Traffic Telemetry & Congestion Injection</h2>
            <p className="text-xs text-slate-400">
              Simulate dynamic traffic spikes and road incidents to trigger real-time reroute recalculation during evaluations.
            </p>
          </div>
        </div>
      </div>

      {/* External Traffic Service Provider Status Card */}
      <div className="bg-slate-950 border border-slate-800 p-5 rounded-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-xl border ${
              providerStatus?.isLiveExternal
                ? "bg-emerald-950/60 border-emerald-800 text-emerald-400"
                : "bg-blue-950/60 border-blue-800 text-blue-400"
            }`}>
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-extrabold text-slate-400">Traffic Provider Mode:</span>
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                  providerStatus?.isLiveExternal
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-blue-900/60 text-blue-300 border border-blue-700/60"
                }`}>
                  {providerStatus?.activeProvider || "Algorithmic (NetworkX Road Impedance Model)"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Data Provenance: <span className="font-mono text-slate-300 font-semibold">{providerStatus?.dataProvenance || "calculated_estimate"}</span> (Real OSM Geometry & Dynamic Weights)
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900 border border-slate-800 p-2.5 rounded-xl">
            <span className="font-bold text-slate-300 block">External API Plug-in:</span>
            <span>Configure <code className="text-purple-400">TOMTOM_API_KEY</code> or <code className="text-purple-400">GOOGLE_MAPS_API_KEY</code> in <code className="text-slate-300">backend/.env</code></span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inject Form */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl">
          <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-4 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-purple-400" />
            <span>Inject Road Congestion Event</span>
          </h3>

          <div className="mb-4 flex flex-wrap gap-2 text-xs">
            <span className="text-slate-400 font-semibold self-center">Presets:</span>
            {activeTrip && (
              <button
                type="button"
                onClick={handleQuickActiveRouteJam}
                className="px-2.5 py-1 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-red-400" />
                <span>Active Route Corridor</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleQuickDavanagereHadadiJam}
              className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-900/80 border border-blue-800/80 text-blue-300 rounded-lg text-xs transition"
            >
              Hadadi Rd (Davanagere)
            </button>
            <button
              type="button"
              onClick={handleQuickDavanagerePBJam}
              className="px-2.5 py-1 bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-800/80 text-cyan-300 rounded-lg text-xs transition"
            >
              PB Rd (Davanagere)
            </button>
            <button
              type="button"
              onClick={handleQuickOldAirportRoadJam}
              className="px-2.5 py-1 bg-purple-950/60 hover:bg-purple-900/80 border border-purple-800/80 text-purple-300 rounded-lg text-xs transition"
            >
              Old Airport Rd (BLR)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Affected Road / Segment</label>
              <input
                type="text"
                value={roadName}
                onChange={(e) => setRoadName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Severity Tier</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="HEAVY_CONGESTION">HEAVY CONGESTION</option>
                  <option value="COMPLETE_BLOCK">ROAD CLOSED / ACCIDENT</option>
                  <option value="MODERATE">MODERATE SLOWDOWN</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Delay Multiplier ({delayFactor}x)</label>
                <input
                  type="range"
                  min="1.5"
                  max="5.0"
                  step="0.1"
                  value={delayFactor}
                  onChange={(e) => setDelayFactor(parseFloat(e.target.value))}
                  className="w-full accent-purple-500 mt-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Incident Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-purple-600/30 transition flex items-center justify-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Congestion & Trigger Reroute Evaluation</span>
            </button>
          </form>
        </div>

        {/* Active Incidents List */}
        <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider mb-4 flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Active Traffic Incidents ({incidents.length})</span>
              </span>
              <span className="text-xs font-normal text-slate-400">Live Graph Edge Updates</span>
            </h3>

            {incidents.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-800 rounded-2xl text-center text-slate-500 text-xs">
                No active traffic incidents. Road network operating at free-flow speeds.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {incidents.map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800">
                          {inc.severity}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">Factor: {inc.delayFactor}x</span>
                      </div>
                      <span className="text-sm font-bold text-white block mt-1">{inc.roadName}</span>
                      <p className="text-xs text-slate-400 mt-0.5">{inc.description}</p>
                    </div>

                    <button
                      onClick={() => onRemoveIncident(inc.id)}
                      className="p-2 bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 rounded-xl transition"
                      title="Clear Incident"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-500 mt-4">
            * Edge weights dynamically recalculate in NetworkX. If an ambulance is en route along an affected segment and ETA increases by $\ge 3$ minutes, a dynamic reroute alert fires automatically.
          </p>
        </div>
      </div>
    </div>
  );
};
