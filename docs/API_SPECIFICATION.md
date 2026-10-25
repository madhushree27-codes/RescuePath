# RescuePath: REST & Real-Time API Specification
**Document Version:** 1.0.0  
**Project Title:** RescuePath: Adaptive Ambulance Routing with Real-Time Decision Support  
**Primary Backend:** Node.js / Express.js (Default Port: `5000`)  
**Routing Microservice:** Python / FastAPI (Default Port: `8000`)  
**Real-Time Bus:** Socket.IO  

---

## 1. Node.js API Gateway Endpoints (`http://localhost:5000`)

### 1.1 Trip Management API

#### `POST /api/trips`
Creates a new emergency dispatch mission and computes initial dual-leg routes.

- **Request Headers:** `Content-Type: application/json`
- **Request Body:**
```json
{
  "emergencyType": "Cardiac Arrest",
  "severity": "CRITICAL",
  "callerNotes": "62-year-old male experiencing acute chest pain and shortness of breath",
  "ambulanceLocation": {
    "name": "Ambulance Station - MG Road",
    "lat": 12.9756,
    "lng": 77.6066
  },
  "patientLocation": {
    "name": "100 Feet Road, Indiranagar",
    "lat": 12.9784,
    "lng": 77.6408
  },
  "selectedHospitalId": null
}
```

- **Response `201 Created`:**
```json
{
  "success": true,
  "trip": {
    "id": "TRIP-2026-0042",
    "status": "DISPATCHED",
    "createdAt": "2026-10-18T16:00:00.000Z",
    "emergencyType": "Cardiac Arrest",
    "severity": "CRITICAL",
    "ambulanceLocation": { "name": "MG Road", "lat": 12.9756, "lng": 77.6066 },
    "patientLocation": { "name": "Indiranagar", "lat": 12.9784, "lng": 77.6408 },
    "selectedHospital": {
      "id": "HOSP-001",
      "name": "Manipal Hospital, Old Airport Road",
      "lat": 12.9592,
      "lng": 77.6534,
      "recommended": true,
      "travelTimeMinutes": 11.4,
      "distanceKm": 4.8,
      "icuBedsAvailable": 4,
      "erBedsAvailable": 7,
      "hasCathLab": true
    },
    "leg1": {
      "description": "Ambulance Origin to Patient Pickup",
      "distanceKm": 4.1,
      "estimatedDurationMinutes": 9.2,
      "trafficDelayMinutes": 1.5,
      "congestionLevel": "MODERATE",
      "waypoints": [[12.9756, 77.6066], [12.9765, 77.6189], [12.9784, 77.6408]],
      "instructions": [
        { "instruction": "Head east on MG Road toward Trinity Circle", "distanceMeters": 1400 },
        { "instruction": "Turn slightly left onto CMH Road toward Indiranagar", "distanceMeters": 2700 }
      ]
    },
    "leg2": {
      "description": "Patient Pickup to Manipal Hospital",
      "distanceKm": 4.8,
      "estimatedDurationMinutes": 11.4,
      "trafficDelayMinutes": 2.1,
      "congestionLevel": "MODERATE",
      "waypoints": [[12.9784, 77.6408], [12.9691, 77.6482], [12.9592, 77.6534]],
      "instructions": [
        { "instruction": "Head south on 100 Feet Road toward Domlur Flyover", "distanceMeters": 2800 },
        { "instruction": "Merge onto Old Airport Road toward Hospital Emergency Gate", "distanceMeters": 2000 }
      ]
    },
    "candidateHospitals": [
      {
        "id": "HOSP-001",
        "name": "Manipal Hospital, Old Airport Road",
        "distanceKm": 4.8,
        "travelTimeMinutes": 11.4,
        "suitabilityScore": 94.2,
        "recommended": true
      },
      {
        "id": "HOSP-002",
        "name": "City Care Hospital, Whitefield",
        "distanceKm": 11.2,
        "travelTimeMinutes": 26.5,
        "suitabilityScore": 68.1,
        "recommended": false
      }
    ]
  }
}
```

---

#### `GET /api/trips`
Retrieves recent trips with optional status filtering.
- **Query Parameters:** `status=ACTIVE|COMPLETED|ALL`, `limit=20`
- **Response `200 OK`:** Array of Trip summary objects.

---

#### `GET /api/trips/:id`
Retrieves detailed state and live navigation telemetry for a specific trip.
- **Response `200 OK`:** Complete Trip object with active leg, route polylines, and candidate hospital matrix.

---

#### `PATCH /api/trips/:id/status`
Advances the mission state machine.
- **Request Body:**
```json
{
  "status": "AT_PATIENT_LOCATION",
  "note": "Patient loaded into ambulance. Commencing Leg 2 transit."
}
```
- **Allowed States:** `DISPATCHED`, `EN_ROUTE_TO_PATIENT`, `AT_PATIENT_LOCATION`, `EN_ROUTE_TO_HOSPITAL`, `ARRIVED_AT_HOSPITAL`, `COMPLETED`, `CANCELLED`.
- **Response `200 OK`:** Updated Trip object with updated timestamp logs.

---

#### `PATCH /api/trips/:id/select-hospital`
Overrides or confirms destination hospital for Leg 2.
- **Request Body:**
```json
{
  "hospitalId": "HOSP-003",
  "overrideReason": "Specialist referral requested by family"
}
```
- **Response `200 OK`:** Updated Trip object with newly calculated Leg 2 route to the chosen hospital.

---

#### `POST /api/trips/:id/accept-reroute`
Accepts a pending dynamic reroute recommendation.
- **Request Body:**
```json
{
  "rerouteId": "REROUTE-9812",
  "accepted": true
}
```
- **Response `200 OK`:** Updated Trip object with new route active and old route archived in audit log.

---

### 1.2 Hospital Decision Support API

#### `GET /api/hospitals`
Returns all registered hospitals with capacity and capability metadata.
- **Query Parameters:** `lat=12.9784`, `lng=77.6408`, `radiusKm=15`
- **Response `200 OK`:** List of hospitals with coordinates, emergency beds, ICU beds, trauma level, and specialties.

---

#### `POST /api/hospitals/evaluate`
Evaluates and ranks candidate hospitals based on live travel time from patient location and clinical requirements.
- **Request Body:**
```json
{
  "patientLocation": { "lat": 12.9784, "lng": 77.6408 },
  "emergencyType": "Cardiac Arrest",
  "severity": "CRITICAL"
}
```
- **Response `200 OK`:** Ranked array of hospitals with computed ETAs, suitability scores, and clear rationale for the recommended choice.

---

### 1.3 Traffic & Incident Injection API

#### `GET /api/traffic/incidents`
Lists active road congestion hotspots, blockages, or construction slowdowns.
- **Response `200 OK`:** Array of active traffic incidents.

---

#### `POST /api/traffic/incidents`
Injects or updates a traffic incident (useful for demonstration and simulated live testing).
- **Request Body:**
```json
{
  "roadName": "Old Airport Road near Domlur Junction",
  "severity": "HEAVY_CONGESTION",
  "lat": 12.9642,
  "lng": 77.6468,
  "delayFactor": 3.2,
  "description": "Multi-vehicle collision blocking two eastbound lanes"
}
```
- **Response `201 Created`:** Created incident record. Emits `traffic:incident_added` via Socket.IO, triggering dynamic reroute checks for impacted trips.

---

#### `GET /api/traffic/lane-analysis`
Provides lane-level clearance telemetry for key monitored intersections.
- **Response `200 OK`:**
```json
{
  "junctionId": "JNC-BLR-012",
  "junctionName": "100 Ft Rd / CMH Rd Junction",
  "source": "simulated_yolo_stream",
  "timestamp": "2026-10-18T16:05:00.000Z",
  "lanes": [
    { "laneNumber": 1, "description": "Left Lane", "occupancyPercent": 85, "status": "CONGESTED", "avgSpeedKmh": 8 },
    { "laneNumber": 2, "description": "Center Lane", "occupancyPercent": 60, "status": "MODERATE", "avgSpeedKmh": 22 },
    { "laneNumber": 3, "description": "Right / Emergency Lane", "occupancyPercent": 15, "status": "CLEAR", "avgSpeedKmh": 45 }
  ],
  "recommendedAction": "Maintain Lane 3 (Emergency Shoulder) for unobstructed junction bypass"
}
```

---

### 1.4 Trip Analytics & Reporting API

#### `GET /api/analytics/summary`
Returns aggregate performance metrics across completed trips.
- **Response `200 OK`:**
```json
{
  "totalTripsRecorded": 158,
  "averageResponseTimeMinutes": 8.7,
  "goldenHourComplianceRatePercent": 96.2,
  "averageDurationVarianceMinutes": 1.4,
  "averageRouteEfficiency": 0.88,
  "rerouteSuccessRatePercent": 92.5
}
```

---

#### `GET /api/analytics/duration-variance`
Provides paired data points of estimated vs. actual transit durations for Recharts visualization.

---

#### `GET /api/analytics/bottlenecks`
Returns the top recurring congestion hotspots and delay durations.

---

### 1.5 System Diagnostics & Configuration API

#### `GET /api/health`
Verifies subsystem status.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "timestamp": "2026-10-18T16:10:00.000Z",
  "services": {
    "nodeBackend": "UP",
    "pythonRoutingEngine": "UP",
    "database": "CONNECTED (MongoDB Atlas / Local Fallback Active)",
    "socketIo": "LISTENING"
  }
}
```

---

## 2. Python FastAPI Routing Service (`http://localhost:8000`)

### `POST /routing/calculate-route`
Calculates optimal path and alternative paths between an origin and destination coordinate using A* and Dijkstra algorithms.

- **Request Body:**
```json
{
  "origin": { "lat": 12.9756, "lng": 77.6066 },
  "destination": { "lat": 12.9784, "lng": 77.6408 },
  "algorithm": "ASTAR",
  "includeAlternatives": true
}
```

- **Response `200 OK`:**
```json
{
  "primaryRoute": {
    "algorithmUsed": "A*",
    "distanceKm": 4.12,
    "durationMinutes": 9.2,
    "congestionLevel": "MODERATE",
    "waypoints": [[12.9756, 77.6066], [12.9765, 77.6189], [12.9784, 77.6408]],
    "segments": [
      { "fromNode": "N-101", "toNode": "N-108", "roadName": "MG Road", "speedKmh": 35, "congestion": "CLEAR" },
      { "fromNode": "N-108", "toNode": "N-204", "roadName": "CMH Road", "speedKmh": 22, "congestion": "MODERATE" }
    ]
  },
  "alternativeRoutes": [
    {
      "description": "Via Old Madras Road Bypass",
      "distanceKm": 5.4,
      "durationMinutes": 11.1,
      "congestionLevel": "CLEAR",
      "timeDifferenceMinutes": 1.9
    }
  ]
}
```

---

### `POST /routing/evaluate-hospitals`
Executes single-source multi-destination Dijkstra search from patient node to all hospital destination nodes. Computes dynamic travel times and composite suitability scores.

---

### `POST /routing/reroute-check`
Takes active trip waypoints, current vehicle coordinates, and updated road network congestion. If a faster route is found that saves $\ge 3 \text{ minutes}$, returns reroute payload.

---

## 3. Real-Time Socket.IO Event Specification

| Event Name | Direction | Payload Description |
|---|---|---|
| `trip:join` | Client $\rightarrow$ Server | `{ "tripId": "TRIP-2026-0042" }` — Joins dedicated room. |
| `vehicle:telemetry` | Client $\rightarrow$ Server | `{ "tripId": "TRIP-2026-0042", "lat": 12.9765, "lng": 77.6189, "speedKmh": 42 }` |
| `trip:updated` | Server $\rightarrow$ Client | Full updated Trip object after any state transition. |
| `trip:reroute_alert` | Server $\rightarrow$ Client | `{ "tripId": "...", "timeSavedMinutes": 4.5, "reason": "Severe jam ahead on Old Airport Rd", "alternativeRoute": {...} }` |
| `trip:traffic_alert` | Server $\rightarrow$ Client | `{ "tripId": "...", "severity": "CONGESTED", "affectedRoad": "Old Airport Road" }` |
| `trip:status_changed`| Server $\rightarrow$ Client | `{ "tripId": "...", "previousStatus": "DISPATCHED", "newStatus": "EN_ROUTE_TO_PATIENT" }` |
