import React from "react";
import { AlertTriangle, Clock, ArrowRight, Check, X } from "lucide-react";

interface RerouteAlertModalProps {
  isOpen: boolean;
  alert: {
    rerouteId: string;
    reason: string;
    timeSavedMinutes: number;
    alternativeRoute: any;
  } | null;
  onAccept: () => void;
  onDismiss: () => void;
}

export const RerouteAlertModal: React.FC<RerouteAlertModalProps> = ({
  isOpen,
  alert,
  onAccept,
  onDismiss
}) => {
  if (!isOpen || !alert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-950 border-2 border-amber-500 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
        {/* Banner */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 text-slate-950 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-slate-950/20 p-2 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-white animate-bounce" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Dynamic Reroute Recommended</h2>
              <p className="text-xs font-semibold text-amber-100">Live Congestion Detection Trigger</p>
            </div>
          </div>
          <button onClick={onDismiss} className="text-white/80 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-2xl">
            <span className="text-xs uppercase font-extrabold text-amber-400 block mb-1">Incident Report</span>
            <p className="text-sm font-bold text-white">{alert.reason}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 block">Time Saved</span>
              <span className="text-3xl font-black text-emerald-400 font-mono mt-1 block">
                -{alert.timeSavedMinutes} <span className="text-sm font-sans font-normal text-slate-400">min</span>
              </span>
            </div>
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <span className="text-xs font-bold text-slate-400 block">New Estimated ETA</span>
              <span className="text-3xl font-black text-white font-mono mt-1 block">
                {alert.alternativeRoute?.estimatedDurationMinutes || 12} <span className="text-sm font-sans font-normal text-slate-400">min</span>
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Accepting updates the active route on the navigation display and notifies dispatch in real-time.
          </p>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={onDismiss}
              className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition"
            >
              Keep Current Route
            </button>
            <button
              onClick={onAccept}
              className="py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/40 transition flex items-center justify-center space-x-2"
            >
              <Check className="w-4 h-4" />
              <span>Accept Faster Route</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
