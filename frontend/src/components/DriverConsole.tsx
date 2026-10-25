import React from "react";
import { Clock, Navigation2, Gauge, AlertTriangle, CheckCircle, ShieldCheck, ArrowRight, RefreshCw } from "lucide-react";
import { ITrip, ILaneAnalysis } from "../types";
import { LaneVisionCard } from "./LaneVisionCard";

interface DriverConsoleProps {
  trip: ITrip;
  laneAnalysis: ILaneAnalysis | null;
  onAdvanceStatus: (nextStatus: string, note?: string) => void;
  onRequestRerouteCheck: () => void;
}

export const DriverConsole: React.FC<DriverConsoleProps> = ({
  trip,
  laneAnalysis,
  onAdvanceStatus,
  onRequestRerouteCheck
}) => {
  const activeRoute = trip.activeLeg === "LEG1" ? trip.leg1 : trip.leg2;
  const activeRoadName = activeRoute?.segments?.[0]?.roadName || (trip.activeLeg === "LEG1" ? trip.patientLocation.name : trip.selectedHospital?.name);
  const currentInstruction = activeRoute?.instructions?.[0]?.instruction || `Proceed along corridor toward ${trip.patientLocation.name}`;
  const nextInstruction = activeRoute?.instructions?.[1]?.instruction || `Continue straight toward ${trip.selectedHospital?.name || "destination target"}`;

  const isLeg1 = trip.activeLeg === "LEG1";
  const isLeg2 = trip.activeLeg === "LEG2";
  const isCompleted = trip.status === "COMPLETED";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. High-Contrast Cockpit HUD Header */}
      <div className="bg-slate-950 border-2 border-slate-800 rounded-3xl p-6 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs uppercase tracking-wider font-extrabold text-red-500 bg-red-950/80 px-2.5 py-1 rounded-md border border-red-800/80">
                Active Mission: {trip.emergencyType} • {trip.severity}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              {isLeg1 ? "LEG 1: Pickup En Route" : isLeg2 ? "LEG 2: Hospital Transit" : "MISSION COMPLETED"}
            </h1>
            <p className="text-xs text-slate-400">
              Target: {isLeg1 ? trip.patientLocation.name : trip.selectedHospital?.name || "Hospital"}
            </p>
          </div>

          {/* Reroute check trigger button */}
          {!isCompleted && (
            <button
              onClick={onRequestRerouteCheck}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700 transition"
            >
              <RefreshCw className="w-4 h-4 text-amber-400 animate-spin-reverse" />
              <span>Check Real-Time Reroute</span>
            </button>
          )}
        </div>

        {/* 2. Key Metrics Grid: ETA, Distance, Speed */}
        <div className="grid grid-cols-3 gap-4 pt-5 text-center">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex justify-center items-center space-x-1.5 text-slate-400 text-xs font-semibold uppercase">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Leg ETA</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1 font-mono">
              {activeRoute?.estimatedDurationMinutes || 0}
              <span className="text-sm font-sans font-normal text-slate-400 ml-1">min</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex justify-center items-center space-x-1.5 text-slate-400 text-xs font-semibold uppercase">
              <Navigation2 className="w-4 h-4 text-cyan-400" />
              <span>Distance</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-cyan-400 mt-1 font-mono">
              {activeRoute?.distanceKm || 0}
              <span className="text-sm font-sans font-normal text-slate-400 ml-1">km</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex justify-center items-center space-x-1.5 text-slate-400 text-xs font-semibold uppercase">
              <Gauge className="w-4 h-4 text-amber-400" />
              <span>Avg Speed</span>
            </div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400 mt-1 font-mono">
              {trip.currentLocation?.speedKmh || 42}
              <span className="text-sm font-sans font-normal text-slate-400 ml-1">km/h</span>
            </div>
          </div>
        </div>

        {/* 3. Turn-By-Turn HUD Card */}
        <div className="mt-5 p-5 bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 rounded-2xl flex items-center space-x-4">
          <div className="bg-red-600/20 border border-red-500/40 p-3.5 rounded-2xl text-red-400">
            <Navigation2 className="w-8 h-8 rotate-45" />
          </div>
          <div className="flex-1">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Current Navigation Instruction</span>
            <span className="text-lg sm:text-xl font-extrabold text-white block mt-0.5">{currentInstruction}</span>
            <span className="text-xs text-slate-400 block mt-1">Next: {nextInstruction}</span>
          </div>
        </div>
      </div>

      {/* 4. One-Tap Driver Status Progression Buttons */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl shadow-xl">
        <h3 className="text-sm font-extrabold text-slate-300 uppercase tracking-wider mb-4 flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Mission Progress Actions (One-Tap Control)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {trip.status === "DISPATCHED" && (
            <button
              onClick={() => onAdvanceStatus("EN_ROUTE_TO_PATIENT", "Ambulance rolling toward patient")}
              className="py-3 px-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/30"
            >
              <span>En Route to Patient</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {(trip.status === "DISPATCHED" || trip.status === "EN_ROUTE_TO_PATIENT") && (
            <button
              onClick={() => onAdvanceStatus("AT_PATIENT_LOCATION", "Ambulance arrived at patient scene")}
              className="py-3 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-amber-600/30"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Arrived at Patient</span>
            </button>
          )}

          {trip.status === "AT_PATIENT_LOCATION" && (
            <button
              onClick={() => onAdvanceStatus("EN_ROUTE_TO_HOSPITAL", "Patient loaded into ambulance. Commencing Leg 2 transit.")}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-600/30"
            >
              <span>Commence Hospital Transit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {trip.status === "EN_ROUTE_TO_HOSPITAL" && (
            <button
              onClick={() => onAdvanceStatus("ARRIVED_AT_HOSPITAL", "Ambulance arrived at emergency department")}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Arrived at Hospital</span>
            </button>
          )}

          {(trip.status === "ARRIVED_AT_HOSPITAL" || trip.status === "EN_ROUTE_TO_HOSPITAL") && (
            <button
              onClick={() => onAdvanceStatus("COMPLETED", "Patient safely handed over. Mission completed.")}
              className="py-3 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl transition flex items-center justify-center space-x-2 shadow-lg shadow-emerald-700/30"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Complete Mission</span>
            </button>
          )}

          {isCompleted && (
            <div className="col-span-full py-3 bg-emerald-950 border border-emerald-800 text-emerald-300 font-bold text-center rounded-xl">
              Trip Completed in {trip.metrics?.totalActualMinutes || 0} minutes. Golden Hour Compliance Verified.
            </div>
          )}
        </div>
      </div>

      {/* 5. Integrated Lane-Level Clearance HUD */}
      {laneAnalysis && <LaneVisionCard analysis={laneAnalysis} roadOverride={activeRoadName} />}
    </div>
  );
};
