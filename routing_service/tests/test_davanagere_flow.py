import os
import sys

# Add project root to sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.graph_manager import graph_manager
from algorithms.astar import calculate_astar_route
from algorithms.dijkstra import evaluate_candidate_hospitals
from traffic.lane_analyzer import analyze_lane_occupancy
from analytics.trip_profiler import analyze_trip_records

def test_davanagere():
    print("Testing Davanagere GMIT Corridor...")
    
    # Coordinates in Davanagere
    # Ambulance at GMIT Campus: 14.4644, 75.9218
    # Patient at Hadadi Road: 14.4580, 75.9150
    amb_lat, amb_lng = 14.4644, 75.9218
    pat_lat, pat_lng = 14.4580, 75.9150
    
    amb_node = graph_manager.find_nearest_node(amb_lat, amb_lng)
    pat_node = graph_manager.find_nearest_node(pat_lat, pat_lng)
    print(f"Nearest nodes: Ambulance={amb_node}, Patient={pat_node}")
    
    leg1 = calculate_astar_route(amb_node, pat_node)
    print(f"Leg 1 Distance: {leg1['primaryRoute']['distanceKm']} km, Duration: {leg1['primaryRoute']['estimatedDurationMinutes']} min")
    
    # Hospitals near patient in Davanagere
    hospitals = evaluate_candidate_hospitals(pat_lat, pat_lng, "Severe Trauma", "CRITICAL")
    print(f"Discovered {len(hospitals)} candidate hospitals:")
    for h in hospitals[:3]:
        print(f" - {h['name']} ({h['distanceKm']} km, ETT: {h['travelTimeMinutes']} min, Score: {h['suitabilityScore']})")
    
    # Verify hospitals are Davanagere facilities
    top_hospital = hospitals[0]
    assert "Davanagere" in top_hospital["name"] or "Bapuji" in top_hospital["name"] or "SS" in top_hospital["name"] or "Chigateri" in top_hospital["name"] or "City" in top_hospital["name"], f"Expected Davanagere hospital, got {top_hospital['name']}"
    print(f"Top Hospital Verified: {top_hospital['name']}")
    
    # Lane analysis with Hadadi Road
    lane = analyze_lane_occupancy("JNC-DVG-01", "Hadadi Road / PB Road Junction")
    print(f"Lane Junction Name: {lane['junctionName']}")
    assert "Hadadi Road" in lane["junctionName"]
    
    print("ALL DAVANAGERE INTEGRATION TESTS PASSED!")

if __name__ == "__main__":
    test_davanagere()
