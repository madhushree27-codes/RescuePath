from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

from core.config import settings
from core.graph_manager import graph_manager
from algorithms.astar import calculate_astar_route
from algorithms.dijkstra import evaluate_candidate_hospitals
from algorithms.rerouting import evaluate_dynamic_reroute
from traffic.congestion_model import congestion_model
from traffic.lane_analyzer import analyze_lane_occupancy
from traffic.external_traffic_adapter import external_traffic_adapter
from analytics.trip_profiler import analyze_trip_records

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="RescuePath Geospatial Routing, Dijkstra/A* Pathfinding, Dynamic Rerouting & Decision Support Service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------- Request Models -----------------
class Coordinate(BaseModel):
    lat: float
    lng: float
    name: Optional[str] = None

class CalculateRouteRequest(BaseModel):
    origin: Coordinate
    destination: Coordinate
    algorithm: Optional[str] = "ASTAR"
    includeAlternatives: Optional[bool] = True

class EvaluateHospitalsRequest(BaseModel):
    patientLocation: Coordinate
    emergencyType: Optional[str] = "Cardiac Arrest"
    severity: Optional[str] = "CRITICAL"

class RerouteCheckRequest(BaseModel):
    currentLat: float
    currentLng: float
    activePathNodes: List[str]
    destinationNode: str
    delayThresholdMinutes: Optional[float] = 3.0

class TrafficIncidentRequest(BaseModel):
    id: Optional[str] = None
    roadName: str
    severity: Optional[str] = "HEAVY_CONGESTION"
    delayFactor: Optional[float] = 2.5
    description: Optional[str] = "Traffic slowdown"
    lat: Optional[float] = 12.9608
    lng: Optional[float] = 77.6415

class AnalyticsRequest(BaseModel):
    trips: Optional[List[Dict[str, Any]]] = None

# ----------------- Endpoints -----------------

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RescuePath Python Routing & Analytical Service",
        "nodesCount": graph_manager.graph.number_of_nodes(),
        "edgesCount": graph_manager.graph.number_of_edges(),
        "activeIncidentsCount": len(congestion_model.incidents)
    }

@app.post("/routing/calculate-route")
def calculate_route(req: CalculateRouteRequest):
    try:
        origin_node = graph_manager.find_nearest_node(req.origin.lat, req.origin.lng)
        dest_node = graph_manager.find_nearest_node(req.destination.lat, req.destination.lng)

        result = calculate_astar_route(
            origin_node=origin_node,
            destination_node=dest_node,
            include_alternative=req.includeAlternatives
        )
        status_info = external_traffic_adapter.get_provider_status()
        result["originNode"] = origin_node
        result["destinationNode"] = dest_node
        result["dataProvenance"] = status_info["dataProvenance"]
        result["activeProvider"] = status_info["activeProvider"]
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/routing/evaluate-hospitals")
def evaluate_hospitals(req: EvaluateHospitalsRequest):
    try:
        ranked_hospitals = evaluate_candidate_hospitals(
            patient_lat=req.patientLocation.lat,
            patient_lng=req.patientLocation.lng,
            emergency_type=req.emergencyType,
            severity=req.severity
        )
        return {
            "success": True,
            "patientLocation": req.patientLocation.model_dump(),
            "candidateHospitals": ranked_hospitals,
            "recommendedHospital": ranked_hospitals[0] if ranked_hospitals else None
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/routing/reroute-check")
def check_reroute(req: RerouteCheckRequest):
    try:
        evaluation = evaluate_dynamic_reroute(
            current_lat=req.currentLat,
            current_lng=req.currentLng,
            active_path_nodes=req.activePathNodes,
            destination_node=req.destinationNode,
            delay_threshold_minutes=req.delayThresholdMinutes
        )
        return evaluation
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/traffic/provider-status")
def get_traffic_provider_status():
    return external_traffic_adapter.get_provider_status()

@app.get("/traffic/incidents")
def get_incidents():
    return congestion_model.list_incidents()

@app.post("/traffic/incidents")
def add_incident(req: TrafficIncidentRequest):
    inc_id = req.id or f"INC-{len(congestion_model.incidents) + 1:03d}"
    incident = congestion_model.report_incident(
        incident_id=inc_id,
        roadName=req.roadName,
        severity=req.severity,
        delayFactor=req.delayFactor,
        description=req.description,
        lat=req.lat,
        lng=req.lng
    )
    return {"success": True, "incident": incident}

@app.delete("/traffic/incidents/{incident_id}")
def delete_incident(incident_id: str):
    removed = congestion_model.remove_incident(incident_id)
    if not removed:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {"success": True, "incidentId": incident_id}

@app.get("/traffic/lane-analysis")
def get_lane_analysis(junctionId: Optional[str] = "JNC-ACTIVE-01", roadName: Optional[str] = None):
    return analyze_lane_occupancy(junction_id=junctionId, road_name=roadName)

@app.post("/analytics/trip-metrics")
def get_analytics(req: AnalyticsRequest):
    try:
        return analyze_trip_records(req.trips)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.HOST, port=settings.PORT)
