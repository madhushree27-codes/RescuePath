import React from "react";
import { Hospital, Award, Bed, Activity, Check, Clock, Navigation } from "lucide-react";
import { ICandidateHospital } from "../types";

interface HospitalMatrixProps {
  hospitals: ICandidateHospital[];
  selectedHospitalId?: string;
  onSelectHospital: (hospitalId: string) => void;
}

export const HospitalMatrix: React.FC<HospitalMatrixProps> = ({
  hospitals,
  selectedHospitalId,
  onSelectHospital
}) => {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-blue-400">
            <Hospital className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">Intelligent Hospital Selection Matrix</h2>
            <p className="text-xs text-slate-400">
              Multi-criteria decision support evaluating live travel time (ETT), ICU/ER bed capacity, and clinical specialty matching instead of naive Euclidean distance.
            </p>
          </div>
        </div>
      </div>

      {/* Hospital Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {hospitals.map((h, idx) => {
          const isSelected = selectedHospitalId === h.id;
          const isRecommended = h.recommended;

          return (
            <div
              key={h.id}
              className={`p-6 rounded-3xl border-2 transition relative flex flex-col justify-between ${
                isSelected
                  ? "bg-slate-900 border-emerald-500 shadow-xl shadow-emerald-500/10"
                  : isRecommended
                  ? "bg-slate-900/90 border-blue-500 shadow-lg shadow-blue-500/10"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Badges */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-slate-500">#{idx + 1} Candidate</span>
                <div className="flex items-center space-x-2">
                  {isRecommended && (
                    <span className="flex items-center space-x-1 bg-blue-500/20 text-blue-400 border border-blue-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      <Award className="w-3.5 h-3.5" />
                      <span>RECOMMENDED</span>
                    </span>
                  )}
                  {isSelected && (
                    <span className="bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full text-xs font-black">
                      ACTIVE DESTINATION
                    </span>
                  )}
                </div>
              </div>

              {/* Name & Address */}
              <div>
                <h3 className="text-lg font-extrabold text-white">{h.name}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{h.address || "Regional Emergency Healthcare Facility"}</p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 my-4 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Travel Time</span>
                  <span className="text-base font-black text-emerald-400 font-mono mt-0.5 flex items-center justify-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{h.travelTimeMinutes} min</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance</span>
                  <span className="text-base font-black text-cyan-400 font-mono mt-0.5 flex items-center justify-center space-x-1">
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{h.distanceKm} km</span>
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ICU Beds Free</span>
                  <span className="text-base font-black text-amber-400 font-mono mt-0.5 flex items-center justify-center space-x-1">
                    <Bed className="w-3.5 h-3.5" />
                    <span>{h.icuBedsAvailable} beds</span>
                  </span>
                </div>
              </div>

              {/* Score & Specialty Match */}
              <div className="flex items-center justify-between text-xs mb-4">
                <span className="text-slate-400">
                  Suitability Score: <span className="font-bold text-white text-sm">{h.suitabilityScore}</span>/100
                </span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  h.hasMatchingSpecialty ? "bg-emerald-950 text-emerald-300 border border-emerald-800" : "bg-slate-800 text-slate-400"
                }`}>
                  {h.hasMatchingSpecialty ? "Specialty Matched" : "General Trauma"}
                </span>
              </div>

              {/* Select Action */}
              <button
                onClick={() => onSelectHospital(h.id)}
                disabled={isSelected}
                className={`w-full py-2.5 rounded-xl font-bold text-xs transition flex items-center justify-center space-x-2 ${
                  isSelected
                    ? "bg-slate-800 text-slate-500 cursor-default"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30"
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Selected Destination</span>
                  </>
                ) : (
                  <span>Route Leg 2 to this Hospital</span>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
