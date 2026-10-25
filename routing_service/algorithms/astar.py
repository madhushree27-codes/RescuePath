import networkx as nx
from typing import Dict, List, Tuple, Any, Optional
from core.graph_manager import graph_manager, haversine_distance

def haversine_heuristic(u: str, v: str) -> float:
    """
    Admissible heuristic for A*:
    Calculates great-circle distance in kilometers and converts to estimated
    minimum travel time in minutes assuming maximum possible highway speed (80 km/h).
    Ensures h(n) <= true remaining cost, preserving A* optimality.
    """
    lat1, lon1 = graph_manager.get_node_coords(u)
    lat2, lon2 = graph_manager.get_node_coords(v)
    dist_km = haversine_distance(lat1, lon1, lat2, lon2)
    max_speed_kmh = 80.0
    return (dist_km / max_speed_kmh) * 60.0

def build_route_details(path_nodes: List[str], graph: nx.DiGraph) -> Dict[str, Any]:
    """Extracts polylines, instructions, distance, and duration from node sequence."""
    waypoints: List[List[float]] = []
    instructions: List[Dict[str, Any]] = []
    segments: List[Dict[str, Any]] = []
    total_length_m = 0.0
    total_duration_min = 0.0
    base_duration_min = 0.0

    for i in range(len(path_nodes)):
        nid = path_nodes[i]
        lat, lng = graph_manager.get_node_coords(nid)
        waypoints.append([lat, lng])

        if i < len(path_nodes) - 1:
            next_nid = path_nodes[i + 1]
            edge_data = graph[nid][next_nid]

            length_m = edge_data.get("lengthMeters", 1000.0)
            weight_min = edge_data.get("weight", 2.0)
            base_min = edge_data.get("baseDurationMin", 2.0)
            road_name = edge_data.get("roadName", "Road")
            congestion = edge_data.get("congestionFactor", 1.0)
            speed_kmh = edge_data.get("freeFlowSpeedKmh", 40.0) / congestion

            total_length_m += length_m
            total_duration_min += weight_min
            base_duration_min += base_min

            level = "CLEAR"
            if congestion > 2.0:
                level = "CONGESTED"
            elif congestion > 1.3:
                level = "MODERATE"

            segments.append({
                "fromNode": nid,
                "toNode": next_nid,
                "roadName": road_name,
                "lengthMeters": length_m,
                "speedKmh": round(speed_kmh, 1),
                "congestionLevel": level
            })

            instructions.append({
                "instruction": f"Proceed on {road_name} toward {graph_manager.node_metadata.get(next_nid, {}).get('name', next_nid)}",
                "distanceMeters": int(length_m)
            })

    traffic_delay_min = max(0.0, total_duration_min - base_duration_min)
    congestion_ratio = total_duration_min / max(base_duration_min, 0.1)

    overall_congestion = "CLEAR"
    if congestion_ratio > 1.6:
        overall_congestion = "CONGESTED"
    elif congestion_ratio > 1.2:
        overall_congestion = "MODERATE"

    return {
        "pathNodes": path_nodes,
        "distanceKm": round(total_length_m / 1000.0, 2),
        "estimatedDurationMinutes": round(total_duration_min, 1),
        "baseDurationMinutes": round(base_duration_min, 1),
        "trafficDelayMinutes": round(traffic_delay_min, 1),
        "congestionLevel": overall_congestion,
        "waypoints": waypoints,
        "instructions": instructions,
        "segments": segments
    }

def calculate_astar_route(origin_node: str, destination_node: str, include_alternative: bool = True) -> Dict[str, Any]:
    """
    Calculates primary optimal route using A* and optionally computes
    a less-congested or alternative corridor.
    """
    g = graph_manager.graph
    graph_manager.connect_nodes_if_needed(origin_node, destination_node)

    # Calculate optimal path using A*
    try:
        primary_path = nx.astar_path(
            g,
            source=origin_node,
            target=destination_node,
            heuristic=haversine_heuristic,
            weight="weight"
        )
    except nx.NetworkXNoPath:
        raise ValueError(f"No path found between {origin_node} and {destination_node}")

    primary_route = build_route_details(primary_path, g)
    primary_route["algorithmUsed"] = "A*"
    primary_route["isPrimary"] = True

    alternatives = []
    if include_alternative and len(primary_path) > 2:
        # Calculate alternative by temporarily penalizing primary path edges
        penalized_graph = g.copy()
        for i in range(len(primary_path) - 1):
            u, v = primary_path[i], primary_path[i + 1]
            if penalized_graph.has_edge(u, v):
                penalized_graph[u][v]["weight"] *= 3.0  # Encourage bypass paths

        try:
            alt_path = nx.astar_path(
                penalized_graph,
                source=origin_node,
                target=destination_node,
                heuristic=haversine_heuristic,
                weight="weight"
            )
            if alt_path != primary_path:
                alt_route = build_route_details(alt_path, g)
                alt_route["algorithmUsed"] = "A* (Bypass Alternative)"
                alt_route["isPrimary"] = False
                alt_route["timeDifferenceMinutes"] = round(alt_route["estimatedDurationMinutes"] - primary_route["estimatedDurationMinutes"], 1)
                alternatives.append(alt_route)
        except nx.NetworkXNoPath:
            pass

    return {
        "primaryRoute": primary_route,
        "alternativeRoutes": alternatives
    }
