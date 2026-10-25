from typing import Dict, Any, List
from core.graph_manager import graph_manager

class CongestionModel:
    def __init__(self):
        self.incidents: Dict[str, Dict[str, Any]] = {}

    def report_incident(
        self,
        incident_id: str,
        road_name: str,
        severity: str,
        delay_factor: float,
        description: str,
        lat: float,
        lng: float
    ) -> Dict[str, Any]:
        """Applies traffic incident slowdown to graph edges."""
        incident = {
            "id": incident_id,
            "roadName": road_name,
            "severity": severity,
            "delayFactor": float(delay_factor),
            "description": description,
            "lat": lat,
            "lng": lng,
            "active": True
        }
        self.incidents[incident_id] = incident

        # Apply slowdown to graph edges matching road name
        incident_delay_min = 4.0 if severity == "HEAVY_CONGESTION" else 2.0
        graph_manager.apply_incident(incident_id, road_name, delay_factor, incident_delay_min)
        return incident

    def remove_incident(self, incident_id: str) -> bool:
        if incident_id in self.incidents:
            del self.incidents[incident_id]
            graph_manager.clear_incident(incident_id)
            return True
        return False

    def list_incidents(self) -> List[Dict[str, Any]]:
        return list(self.incidents.values())

congestion_model = CongestionModel()
