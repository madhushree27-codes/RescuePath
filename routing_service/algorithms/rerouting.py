from typing import Dict, List, Any
import networkx as nx
from core.graph_manager import graph_manager
from algorithms.astar import calculate_astar_route, build_route_details
from core.config import settings

def evaluate_dynamic_reroute(
    current_lat: float,
    current_lng: float,
    active_path_nodes: List[str],
    destination_node: str,
    delay_threshold_minutes: float = None
) -> Dict[str, Any]:
    """
    Evaluates whether unexpected traffic congestion on the current path warrants
    an automatic reroute recommendation for the ambulance.
    """
    if delay_threshold_minutes is None:
        delay_threshold_minutes = settings.REROUTE_DELAY_THRESHOLD_MINUTES

    g = graph_manager.graph
    current_node = graph_manager.find_nearest_node(current_lat, current_lng)

    # 1. Determine remaining planned path from current_node to destination
    if current_node in active_path_nodes:
        idx = active_path_nodes.index(current_node)
        remaining_current_path = active_path_nodes[idx:]
    else:
        # If vehicle drifted off planned nodes, stitch current_node to destination
        remaining_current_path = [current_node, destination_node]

    # Calculate remaining travel time on the current route under active edge weights
    current_remaining_duration = 0.0
    valid_current_path = True
    for i in range(len(remaining_current_path) - 1):
        u, v = remaining_current_path[i], remaining_current_path[i + 1]
        if g.has_edge(u, v):
            current_remaining_duration += g[u][v]["weight"]
        else:
            valid_current_path = False
            break

    # 2. Compute freshly recalculated optimal path from current_node to destination
    fresh_routing = calculate_astar_route(current_node, destination_node, include_alternative=False)
    new_route = fresh_routing["primaryRoute"]
    new_duration = new_route["estimatedDurationMinutes"]

    # 3. Check delay threshold
    time_saved = current_remaining_duration - new_duration
    reroute_recommended = (time_saved >= delay_threshold_minutes) and (new_route["pathNodes"] != remaining_current_path)

    reason = ""
    if reroute_recommended:
        reason = f"Severe congestion ahead. Alternative bypass saves {round(time_saved, 1)} minutes."
    elif not valid_current_path:
        reroute_recommended = True
        reason = "Off-route detected. Navigation recalculated."
    else:
        reason = "Current route remains optimal."

    return {
        "rerouteRecommended": reroute_recommended,
        "timeSavedMinutes": round(max(0.0, time_saved), 1),
        "currentRemainingDurationMinutes": round(current_remaining_duration, 1),
        "newRouteDurationMinutes": round(new_duration, 1),
        "thresholdMinutes": delay_threshold_minutes,
        "reason": reason,
        "alternativeRoute": new_route if reroute_recommended else None
    }
