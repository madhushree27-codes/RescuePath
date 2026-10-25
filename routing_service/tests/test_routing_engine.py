import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.graph_manager import graph_manager
from algorithms.astar import calculate_astar_route
from algorithms.dijkstra import evaluate_candidate_hospitals
from algorithms.rerouting import evaluate_dynamic_reroute
from traffic.congestion_model import congestion_model
from traffic.lane_analyzer import analyze_lane_occupancy
from analytics.trip_profiler import analyze_trip_records

def test_engine():
    print("=== Testing RescuePath Routing Engine ===")
    
    # 1. Verify Graph
    nodes_count = graph_manager.graph.number_of_nodes()
    edges_count = graph_manager.graph.number_of_edges()
    print(f"[OK] Graph loaded: {nodes_count} nodes, {edges_count} edges.")
    assert nodes_count >= 15, "Expected at least 15 nodes"
    assert edges_count >= 25, "Expected at least 25 edges"

    # 2. Test A* Route (MG Road -> Indiranagar)
    origin_node = graph_manager.find_nearest_node(12.9756, 77.6066)
    dest_node = graph_manager.find_nearest_node(12.9784, 77.6408)
    print(f"Nearest nodes: Origin={origin_node}, Dest={dest_node}")

    route_res = calculate_astar_route(origin_node, dest_node, include_alternative=True)
    primary = route_res["primaryRoute"]
    print(f"[OK] A* Route calculated: {primary['distanceKm']} km, {primary['estimatedDurationMinutes']} min, {len(primary['waypoints'])} waypoints.")
    assert primary["distanceKm"] > 0
    assert len(primary["waypoints"]) >= 2

    # 3. Test Dijkstra Hospital Evaluation (From Indiranagar)
    hospitals = evaluate_candidate_hospitals(12.9784, 77.6408, emergency_type="Cardiac Arrest", severity="CRITICAL")
    print(f"[OK] Dijkstra evaluated {len(hospitals)} hospitals.")
    top_rec = hospitals[0]
    print(f"[OK] Top Recommended: {top_rec['name']} (Travel Time: {top_rec['travelTimeMinutes']} min, Score: {top_rec['suitabilityScore']})")
    assert top_rec["recommended"] is True

    # 4. Test Dynamic Rerouting Trigger
    # Inject heavy congestion on active road segment
    congestion_model.report_incident("INC-TEST", "Old Airport Road", "HEAVY_CONGESTION", 4.0, "Major pileup", 12.9608, 77.6415)
    reroute = evaluate_dynamic_reroute(
        current_lat=12.9784,
        current_lng=77.6408,
        active_path_nodes=primary["pathNodes"],
        destination_node="N-WHT-17",
        delay_threshold_minutes=2.0
    )
    print(f"[OK] Reroute evaluation: Recommended={reroute['rerouteRecommended']}, Reason={reroute['reason']}")
    congestion_model.remove_incident("INC-TEST")

    # 5. Test Lane Analysis
    lane_info = analyze_lane_occupancy()
    print(f"[OK] Lane analysis: {len(lane_info['lanes'])} lanes. Recommended lane: {lane_info['recommendedLane']}")
    assert len(lane_info["lanes"]) == 3

    # 6. Test Analytics (Pandas/NumPy)
    metrics = analyze_trip_records()
    print(f"[OK] Analytics: Total Trips={metrics['summary']['totalTripsRecorded']}, Golden Hour Compliance={metrics['summary']['goldenHourComplianceRatePercent']}%")
    assert metrics["summary"]["totalTripsRecorded"] > 0

    print("=== All Routing Engine Tests Passed Successfully! ===")

if __name__ == "__main__":
    test_engine()
