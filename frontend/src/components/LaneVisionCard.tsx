import React from "react";
import { Camera, CheckCircle2, AlertOctagon, Car } from "lucide-react";
import { ILaneAnalysis } from "../types";

interface LaneVisionCardProps {
  analysis: ILaneAnalysis;
  roadOverride?: string;
}

export const LaneVisionCard: React.FC<LaneVisionCardProps> = ({ analysis, roadOverride }) => {
  const displayLocation = roadOverride
    ? (roadOverride.includes("Junction") || roadOverride.includes("Road") || roadOverride.includes("Circle") || roadOverride.includes("Cross")
        ? `${roadOverride} Transit Junction`
        : `${roadOverride} / Emergency Corridor`)
    : (analysis.junctionName || "Active Emergency Corridor Junction");

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400">
            <Camera className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white flex items-center space-x-2">
              <span>Lane-Level Congestion Analysis</span>
              <span className="text-[10px] bg-blue-950 text-blue-400 border border-blue-800 px-2 py-0.5 rounded-full font-mono">
                YOLOv8 / DeepSORT
              </span>
            </h3>
            <p className="text-xs text-cyan-300 font-medium">{displayLocation}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block font-mono">Source: {analysis.source}</span>
          <span className="text-xs text-emerald-400 font-bold block">Live Clearance Active</span>
        </div>
      </div>

      {/* Lanes Visual Representation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {analysis.lanes.map((lane) => {
          const isRecommended = lane.laneNumber === analysis.recommendedLane;
          const isClear = lane.status === "CLEAR";
          const isModerate = lane.status === "MODERATE";

          return (
            <div
              key={lane.laneNumber}
              className={`p-4 rounded-2xl border-2 transition ${
                isRecommended
                  ? "bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-500/20"
                  : "bg-slate-900 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-300">Lane {lane.laneNumber}</span>
                {isRecommended && (
                  <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                    Recommended Passing
                  </span>
                )}
              </div>

              <div className="text-sm font-bold text-white mb-2">{lane.description}</div>

              {/* Progress bar of occupancy */}
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isClear ? "bg-emerald-500" : isModerate ? "bg-amber-500" : "bg-rose-500"
                  }`}
                  style={{ width: `${lane.occupancyPercent}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs text-slate-400 font-mono">
                <span className="flex items-center space-x-1">
                  <Car className="w-3.5 h-3.5 text-slate-500" />
                  <span>{lane.vehicleCount} vehicles</span>
                </span>
                <span className="font-bold text-white">{lane.avgSpeedKmh} km/h</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommended action banner */}
      <div className="mt-4 p-3.5 bg-emerald-950/60 border border-emerald-800/80 rounded-xl flex items-center space-x-3 text-xs text-emerald-300">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="font-semibold">{analysis.recommendedAction}</span>
      </div>
    </div>
  );
};
