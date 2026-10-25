import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Navbar } from "./components/Navbar";
import { MapView } from "./components/MapView";
import { DriverConsole } from "./components/DriverConsole";
import { HospitalMatrix } from "./components/HospitalMatrix";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { TrafficControl } from "./components/TrafficControl";
import { DispatchModal } from "./components/DispatchModal";
import { RerouteAlertModal } from "./components/RerouteAlertModal";
import { api } from "./services/api";
import { ITrip, ICandidateHospital, ITrafficIncident, ILaneAnalysis } from "./types";
import { AlertCircle, CheckCircle, Navigation, Siren } from "lucide-react";

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"mission" | "cockpit" | "hospitals" | "analytics" | "traffic">("mission");
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [activeTrip, setActiveTrip] = useState<ITrip | null>(null);
  const [candidateHospitals, setCandidateHospitals] = useState<ICandidateHospital[]>([]);
  const [incidents, setIncidents] = useState<ITrafficIncident[]>([]);
  const [laneAnalysis, setLaneAnalysis] = useState<ILaneAnalysis | null>(null);
  const [rerouteAlert, setRerouteAlert] = useState<{
    rerouteId: string;
    reason: string;
    timeSavedMinutes: number;
    alternativeRoute: any;
  } | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Initial Data Fetch & Socket.IO initialization
  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"]
    });
    setSocket(s);

    s.on("connect", () => {
      console.log("[Socket.IO] Connected to backend gateway");
    });

    s.on("trip:updated", (trip: ITrip) => {
      setActiveTrip(trip);
      if (trip.candidateHospitals && trip.candidateHospitals.length > 0) {
        setCandidateHospitals(trip.candidateHospitals);
      }
    });

    s.on("trip:reroute_alert", (alert: any) => {
      setRerouteAlert(alert);
      showNotification(`Reroute Recommendation: Saves ${alert.timeSavedMinutes} minutes!`);
    });

    s.on("traffic:incident_updated", () => {
      loadIncidents();
    });

    // Load initial states
    loadInitialData();

    return () => {
      s.disconnect();
    };
  }, []);

  // Join trip room when activeTrip changes
  useEffect(() => {
    if (socket && activeTrip) {
      socket.emit("trip:join", activeTrip.id);
    }
  }, [socket, activeTrip?.id]);

  const loadInitialData = async () => {
    try {
      const [hosps, incs, lanes, trips] = await Promise.all([
        api.getHospitals(),
        api.getIncidents(),
        api.getLaneAnalysis(),
        api.getTrips()
      ]);
      setCandidateHospitals(hosps);
      setIncidents(incs);
      setLaneAnalysis(lanes);

      // If active trip exists, select the first active or latest one
      if (trips && trips.length > 0) {
        const ongoing = trips.find((t) => t.status !== "COMPLETED") || trips[0];
        setActiveTrip(ongoing);
        if (ongoing.candidateHospitals && ongoing.candidateHospitals.length > 0) {
          setCandidateHospitals(ongoing.candidateHospitals);
        } else {
          const nearbyHosps = await api.getHospitals(ongoing.patientLocation.lat, ongoing.patientLocation.lng);
          setCandidateHospitals(nearbyHosps);
        }
        const activeRoad = ongoing.leg1?.segments?.[0]?.roadName || ongoing.patientLocation.name;
        api.getLaneAnalysis(undefined, activeRoad).then(setLaneAnalysis).catch(() => {});
      }
    } catch (err) {
      console.error("Error loading initial data:", err);
    }
  };

  const loadIncidents = async () => {
    try {
      const incs = await api.getIncidents();
      setIncidents(incs);
    } catch (err) {
      console.error("Error loading incidents:", err);
    }
  };

  const handleDispatchSubmit = async (data: any) => {
    try {
      showNotification("Calculating dual-leg routes with A* & evaluating hospitals with Dijkstra...");
      const newTrip = await api.createTrip(data);
      setActiveTrip(newTrip);
      if (newTrip.candidateHospitals && newTrip.candidateHospitals.length > 0) {
        setCandidateHospitals(newTrip.candidateHospitals);
      } else {
        const nearbyHosps = await api.getHospitals(newTrip.patientLocation.lat, newTrip.patientLocation.lng);
        setCandidateHospitals(nearbyHosps);
      }
      const activeRoad = newTrip.leg1?.segments?.[0]?.roadName || newTrip.patientLocation.name;
      api.getLaneAnalysis(undefined, activeRoad).then(setLaneAnalysis).catch(() => {});

      setActiveTab("mission");
      showNotification(`Ambulance Dispatched: ${newTrip.id}`);
    } catch (err: any) {
      alert("Failed to create dispatch: " + err.message);
    }
  };

  const handleAdvanceStatus = async (status: string, note?: string) => {
    if (!activeTrip) return;
    try {
      const updated = await api.updateTripStatus(activeTrip.id, status, note);
      setActiveTrip(updated);
      showNotification(`Status Updated: ${status}`);
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleSelectHospital = async (hospitalId: string) => {
    if (!activeTrip) return;
    try {
      const updated = await api.selectHospital(activeTrip.id, hospitalId);
      setActiveTrip(updated);
      showNotification(`Selected ${updated.selectedHospital?.name}. Leg 2 route updated!`);
    } catch (err: any) {
      alert("Failed to change hospital: " + err.message);
    }
  };

  const handleAcceptReroute = async () => {
    if (!activeTrip || !rerouteAlert) return;
    try {
      const updated = await api.acceptReroute(
        activeTrip.id,
        rerouteAlert.rerouteId,
        rerouteAlert.alternativeRoute,
        rerouteAlert.timeSavedMinutes
      );
      setActiveTrip(updated);
      setRerouteAlert(null);
      showNotification("Reroute Accepted! Faster bypass path loaded.");
    } catch (err: any) {
      alert("Failed to accept reroute: " + err.message);
    }
  };

  const handleAddIncident = async (incident: any) => {
    try {
      await api.createIncident(incident);
      loadIncidents();
      showNotification(`Incident reported on ${incident.roadName}. Graph edge impedance updated.`);

      // If active trip exists, simulate vehicle telemetry to trigger reroute check
      if (activeTrip && activeTrip.status !== "COMPLETED") {
        setTimeout(async () => {
          await api.sendTelemetry(activeTrip.id, 12.9784, 77.6408, 38);
        }, 800);
      }
    } catch (err: any) {
      alert("Failed to add incident: " + err.message);
    }
  };

  const handleRemoveIncident = async (id: string) => {
    try {
      await api.deleteIncident(id);
      loadIncidents();
      showNotification("Incident cleared. Free flow restored.");
    } catch (err: any) {
      alert("Failed to remove incident: " + err.message);
    }
  };

  const handleRequestRerouteCheck = async () => {
    if (!activeTrip) return;
    showNotification("Evaluating dynamic edge weights against active route...");
    try {
      await api.sendTelemetry(
        activeTrip.id,
        activeTrip.currentLocation?.lat || activeTrip.ambulanceLocation.lat,
        activeTrip.currentLocation?.lng || activeTrip.ambulanceLocation.lng,
        42
      );
    } catch (err: any) {
      alert("Reroute check error: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openDispatch={() => setIsDispatchOpen(true)}
        isLiveTracking={!!activeTrip}
        activeTripId={activeTrip?.id}
      />

      {/* Real-Time Notification Pill */}
      {notification && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-600 text-white font-bold text-xs px-4 py-2.5 rounded-2xl shadow-2xl flex items-center space-x-2 animate-bounce">
          <CheckCircle className="w-4 h-4" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {/* Mission Map Tab */}
        {activeTab === "mission" && (
          <div className="space-y-6">
            <MapView
              trip={activeTrip}
              candidateHospitals={candidateHospitals}
              incidents={incidents}
              onSelectHospital={handleSelectHospital}
            />

            {/* Quick Mission Summary Card */}
            {activeTrip ? (
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-3xl grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs uppercase font-extrabold text-red-500 block">Mission {activeTrip.id}</span>
                  <h3 className="text-lg font-black text-white mt-0.5">{activeTrip.emergencyType}</h3>
                  <span className="text-xs text-slate-400">Severity: {activeTrip.severity}</span>
                </div>
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 block">Active Status</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-sm font-extrabold text-emerald-400">{activeTrip.status}</span>
                  </div>
                  <span className="text-xs text-slate-400 mt-1 block">
                    Current Leg: {activeTrip.activeLeg === "LEG1" ? "Pickup (Leg 1)" : "Hospital (Leg 2)"}
                  </span>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => setActiveTab("cockpit")}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-amber-600/30 transition flex items-center space-x-2"
                  >
                    <Navigation className="w-4 h-4" />
                    <span>Open Driver Cockpit HUD</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-8 bg-slate-950 border border-slate-800 rounded-3xl text-center">
                <Siren className="w-8 h-8 text-red-500 mx-auto mb-2 animate-bounce" />
                <h3 className="text-base font-bold text-white">No Active Emergency Mission</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Click "New Dispatch" to enter an ambulance location, patient incident, and generate real-time dual-leg routes with intelligent hospital selection.
                </p>
                <button
                  onClick={() => setIsDispatchOpen(true)}
                  className="mt-4 px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl transition"
                >
                  Launch Demonstration Scenario
                </button>
              </div>
            )}
          </div>
        )}

        {/* Driver Cockpit Tab */}
        {activeTab === "cockpit" && activeTrip && (
          <DriverConsole
            trip={activeTrip}
            laneAnalysis={laneAnalysis}
            onAdvanceStatus={handleAdvanceStatus}
            onRequestRerouteCheck={handleRequestRerouteCheck}
          />
        )}
        {activeTab === "cockpit" && !activeTrip && (
          <div className="p-12 text-center text-slate-400">
            Please create an emergency dispatch first to view the driver navigation cockpit.
          </div>
        )}

        {/* Hospital Matrix Tab */}
        {activeTab === "hospitals" && (
          <HospitalMatrix
            hospitals={candidateHospitals}
            selectedHospitalId={activeTrip?.selectedHospital?.id}
            onSelectHospital={handleSelectHospital}
          />
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && <AnalyticsDashboard />}

        {/* Traffic Control Tab */}
        {activeTab === "traffic" && (
          <TrafficControl
            incidents={incidents}
            activeTrip={activeTrip}
            onAddIncident={handleAddIncident}
            onRemoveIncident={handleRemoveIncident}
          />
        )}
      </main>

      {/* Emergency Intake Modal */}
      <DispatchModal
        isOpen={isDispatchOpen}
        onClose={() => setIsDispatchOpen(false)}
        onSubmit={handleDispatchSubmit}
      />

      {/* Dynamic Reroute Alert Modal */}
      <RerouteAlertModal
        isOpen={!!rerouteAlert}
        alert={rerouteAlert}
        onAccept={handleAcceptReroute}
        onDismiss={() => setRerouteAlert(null)}
      />
    </div>
  );
};
