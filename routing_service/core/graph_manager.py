import os
import json
import math
import glob
from typing import Dict, List, Tuple, Optional, Any
import networkx as nx
from core.config import settings

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate the great circle distance between two points in kilometers."""
    R = 6371.0  # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (math.sin(dlat / 2.0) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

class GraphManager:
    def __init__(self):
        self.graph = nx.DiGraph()
        self.node_positions: Dict[str, Tuple[float, float]] = {}
        self.node_metadata: Dict[str, Dict[str, Any]] = {}
        self.active_incidents: Dict[str, Dict[str, Any]] = {}
        self.load_graph()

    def load_graph(self):
        """Loads all regional road network topologies (*_network.json) into NetworkX DiGraph."""
        self.graph.clear()
        self.node_positions.clear()
        self.node_metadata.clear()

        network_files = glob.glob(os.path.join(settings.DATA_DIR, "*_network.json"))
        if not network_files:
            network_files = [os.path.join(settings.DATA_DIR, "bangalore_network.json")]

        for n_file in network_files:
            try:
                with open(n_file, "r") as f:
                    data = json.load(f)

                for node in data.get("nodes", []):
                    nid = node["id"]
                    lat = float(node["lat"])
                    lng = float(node["lng"])
                    self.graph.add_node(nid, lat=lat, lng=lng, name=node.get("name", nid), type=node.get("type", "junction"))
                    self.node_positions[nid] = (lat, lng)
                    self.node_metadata[nid] = node

                for edge in data.get("edges", []):
                    u = edge["from"]
                    v = edge["to"]
                    length_m = float(edge.get("lengthMeters", 1000.0))
                    free_speed_kmh = float(edge.get("freeFlowSpeedKmh", 40.0))
                    lanes = int(edge.get("lanes", 2))
                    road_class = edge.get("roadClass", "arterial")
                    road_name = edge.get("roadName", "Road Segment")

                    # Base travel time in minutes: (distance in km / speed in km/h) * 60
                    base_duration_min = (length_m / 1000.0) / max(free_speed_kmh, 5.0) * 60.0

                    self.graph.add_edge(
                        u, v,
                        id=edge.get("id", f"{u}->{v}"),
                        roadName=road_name,
                        lengthMeters=length_m,
                        freeFlowSpeedKmh=free_speed_kmh,
                        lanes=lanes,
                        roadClass=road_class,
                        congestionFactor=1.0,
                        incidentDelayMin=0.0,
                        baseDurationMin=base_duration_min,
                        weight=base_duration_min
                    )
            except Exception as e:
                print(f"[GraphManager] Error loading {n_file}: {e}")

    def find_nearest_node(self, lat: float, lng: float, name: Optional[str] = None) -> str:
        """
        Finds the closest node in graph to arbitrary GPS coordinate.
        If the closest node is > 20 km away (meaning an arbitrary new city/location was entered),
        dynamically registers a localized node so routing connects precisely to that location.
        """
        best_node = None
        min_dist = float("inf")
        for nid, (nlat, nlng) in self.node_positions.items():
            dist = haversine_distance(lat, lng, nlat, nlng)
            if dist < min_dist:
                min_dist = dist
                best_node = nid

        # If near an existing graph node (<= 20 km), snap to it
        if best_node and min_dist <= 20.0:
            return best_node

        # Otherwise, dynamically create a localized node
        node_id = f"LOC-{abs(hash((lat, lng))) % 100000:05d}"
        node_name = name or f"Location ({round(lat, 4)}, {round(lng, 4)})"
        self.graph.add_node(node_id, lat=lat, lng=lng, name=node_name, type="dynamic_location")
        self.node_positions[node_id] = (lat, lng)
        self.node_metadata[node_id] = {"id": node_id, "name": node_name, "lat": lat, "lng": lng}

        # If there are any nodes within 60km, link to the closest one
        if best_node and min_dist <= 60.0:
            dist_m = min_dist * 1000.0
            dur_min = (min_dist / 40.0) * 60.0
            self.graph.add_edge(node_id, best_node, roadName="Connecting Corridor", lengthMeters=dist_m, freeFlowSpeedKmh=40.0, lanes=2, congestionFactor=1.0, incidentDelayMin=0.0, baseDurationMin=dur_min, weight=dur_min)
            self.graph.add_edge(best_node, node_id, roadName="Connecting Corridor", lengthMeters=dist_m, freeFlowSpeedKmh=40.0, lanes=2, congestionFactor=1.0, incidentDelayMin=0.0, baseDurationMin=dur_min, weight=dur_min)

        return node_id

    def connect_nodes_if_needed(self, u: str, v: str, road_name: str = "Transit Corridor"):
        """Ensures a traversable path exists between two nodes if they are in different disconnected subgraphs."""
        if not nx.has_path(self.graph, u, v):
            lat1, lon1 = self.node_positions[u]
            lat2, lon2 = self.node_positions[v]
            dist_km = haversine_distance(lat1, lon1, lat2, lon2)
            dist_m = dist_km * 1000.0
            dur_min = (dist_km / 45.0) * 60.0

            self.graph.add_edge(
                u, v,
                roadName=road_name,
                lengthMeters=dist_m,
                freeFlowSpeedKmh=45.0,
                lanes=2,
                congestionFactor=1.0,
                incidentDelayMin=0.0,
                baseDurationMin=dur_min,
                weight=dur_min
            )
            self.graph.add_edge(
                v, u,
                roadName=road_name,
                lengthMeters=dist_m,
                freeFlowSpeedKmh=45.0,
                lanes=2,
                congestionFactor=1.0,
                incidentDelayMin=0.0,
                baseDurationMin=dur_min,
                weight=dur_min
            )

    def update_edge_congestion(self, u: str, v: str, congestion_factor: float, incident_delay_min: float = 0.0):
        if self.graph.has_edge(u, v):
            edge = self.graph[u][v]
            edge["congestionFactor"] = max(1.0, float(congestion_factor))
            edge["incidentDelayMin"] = max(0.0, float(incident_delay_min))
            effective_speed = edge["freeFlowSpeedKmh"] / edge["congestionFactor"]
            length_km = edge["lengthMeters"] / 1000.0
            new_weight = (length_km / max(effective_speed, 3.0)) * 60.0 + edge["incidentDelayMin"]
            edge["weight"] = new_weight

    def apply_incident(self, incident_id: str, road_name: str, delay_factor: float, incident_delay_min: float):
        self.active_incidents[incident_id] = {
            "roadName": road_name,
            "delayFactor": delay_factor,
            "incidentDelayMin": incident_delay_min
        }
        for u, v, data in self.graph.edges(data=True):
            if road_name.lower() in data.get("roadName", "").lower():
                self.update_edge_congestion(u, v, delay_factor, incident_delay_min)

    def clear_incident(self, incident_id: str):
        if incident_id in self.active_incidents:
            road_name = self.active_incidents[incident_id]["roadName"]
            del self.active_incidents[incident_id]
            for u, v, data in self.graph.edges(data=True):
                if road_name.lower() in data.get("roadName", "").lower():
                    self.update_edge_congestion(u, v, 1.0, 0.0)

    def get_node_coords(self, nid: str) -> Tuple[float, float]:
        return self.node_positions[nid]

# Singleton instance
graph_manager = GraphManager()
