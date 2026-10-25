import React from "react";
import { Activity, ShieldAlert, Navigation, Hospital, BarChart3, Radio, PlusCircle, AlertTriangle } from "lucide-react";

interface NavbarProps {
  activeTab: "mission" | "cockpit" | "hospitals" | "analytics" | "traffic";
  setActiveTab: (tab: "mission" | "cockpit" | "hospitals" | "analytics" | "traffic") => void;
  openDispatch: () => void;
  isLiveTracking: boolean;
  activeTripId?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openDispatch,
  isLiveTracking,
  activeTripId
}) => {
  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 p-2 rounded-lg text-white shadow-lg shadow-red-600/30">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tight text-white">RESCUE<span className="text-red-500">PATH</span></span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Adaptive Ambulance Routing & Decision Support</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs sm:text-sm">
          <button
            onClick={() => setActiveTab("mission")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === "mission" ? "bg-red-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Navigation className="w-4 h-4" />
            <span className="hidden md:inline">Mission Map</span>
          </button>

          <button
            onClick={() => setActiveTab("cockpit")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === "cockpit" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Radio className="w-4 h-4" />
            <span className="hidden md:inline">Driver Cockpit</span>
          </button>

          <button
            onClick={() => setActiveTab("hospitals")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === "hospitals" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <Hospital className="w-4 h-4" />
            <span className="hidden md:inline">Hospitals</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === "analytics" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden md:inline">Trip Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab("traffic")}
            className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
              activeTab === "traffic" ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span className="hidden md:inline">Traffic Control</span>
          </button>
        </nav>

        {/* Dispatch Action & Status */}
        <div className="flex items-center space-x-3">
          {activeTripId && (
            <div className="hidden lg:flex items-center space-x-2 bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono font-medium">{activeTripId} Active</span>
            </div>
          )}

          <button
            onClick={openDispatch}
            className="bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg shadow-red-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Dispatch</span>
          </button>
        </div>
      </div>
    </header>
  );
};
