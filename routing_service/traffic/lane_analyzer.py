from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import hashlib

def analyze_lane_occupancy(
    junction_id: str = "JNC-ACTIVE-01",
    road_name: Optional[str] = None
) -> Dict[str, Any]:
    """
    Simulates / processes micro-level lane clearance telemetry based on
    YOLOv8 vehicle detection and DeepSORT tracking framework.
    Evaluates individual lane speeds and recommends optimal passing corridor
    dynamically mapped to the active corridor and location.
    """
    timestamp = datetime.now(timezone.utc).isoformat()
    
    # Resolve display junction name based on road_name or junction_id
    if road_name and len(road_name.strip()) > 0:
        cleaned_road = road_name.strip()
        # If the road name doesn't specify junction, frame it nicely
        if "Junction" in cleaned_road or "Cross" in cleaned_road or "Circle" in cleaned_road or "/" in cleaned_road:
            display_junction = cleaned_road
        else:
            display_junction = f"{cleaned_road} / Emergency Transit Corridor"
    else:
        display_junction = "Active Emergency Corridor Junction"

    # Deterministic variation based on junction name so it stays stable yet dynamic per road
    seed_val = int(hashlib.md5(display_junction.encode("utf-8")).hexdigest()[:4], 16)
    
    # Standard 3-lane emergency corridor layout
    lanes = [
        {
            "laneNumber": 1,
            "description": "Left Lane (Mixed Transit)",
            "occupancyPercent": 75 + (seed_val % 18),
            "status": "CONGESTED",
            "vehicleCount": 20 + (seed_val % 10),
            "avgSpeedKmh": 12.0 + (seed_val % 5)
        },
        {
            "laneNumber": 2,
            "description": "Center Lane (Through Traffic)",
            "occupancyPercent": 50 + ((seed_val // 2) % 20),
            "status": "MODERATE",
            "vehicleCount": 14 + ((seed_val // 3) % 8),
            "avgSpeedKmh": 24.0 + (seed_val % 6)
        },
        {
            "laneNumber": 3,
            "description": "Right Lane / Emergency Priority Shoulder",
            "occupancyPercent": 15 + ((seed_val // 4) % 15),
            "status": "CLEAR",
            "vehicleCount": 3 + (seed_val % 4),
            "avgSpeedKmh": 48.0 + (seed_val % 8)
        }
    ]

    # Find the clearest lane
    clearest_lane = min(lanes, key=lambda l: l["occupancyPercent"])
    
    return {
        "junctionId": junction_id,
        "junctionName": display_junction,
        "timestamp": timestamp,
        "source": "simulated_yolo_stream",
        "lanes": lanes,
        "recommendedLane": clearest_lane["laneNumber"],
        "recommendedAction": f"Maintain Lane {clearest_lane['laneNumber']} ({clearest_lane['description']}) for uninterrupted transit."
    }
