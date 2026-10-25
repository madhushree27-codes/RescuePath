# RescuePath: Comprehensive Implementation Plan
**Document Version:** 1.0.0  
**Project Title:** RescuePath: Adaptive Ambulance Routing with Real-Time Decision Support  
**Institution:** Department of Computer Science & Engineering, GM Institute of Technology (GMIT), Davanagere  
**Affiliation:** Visvesvaraya Technological University (VTU), Belagavi  
**Authors:** Madhushree N, Dhanya S V, Deepa C M, Padmavati S A  
**Guide:** Dr. Chethan Chandra S Basavaraddi  

---

## 1. Project Directory Structure

The repository is structured as an integrated multi-service monorepo with distinct responsibility boundaries:

```
rescuepath/
├── docs/
│   ├── PROJECT_REQUIREMENTS.md
│   ├── SYSTEM_ARCHITECTURE.md
│   ├── IMPLEMENTATION_PLAN.md
│   ├── API_SPECIFICATION.md
│   ├── DATA_MODEL.md
│   └── OBJECTIVE_TRACEABILITY.md
│
├── backend/                             # Node.js + Express + Socket.IO
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   ├── src/
│   │   ├── server.ts                    # Entry point, HTTP server & Socket.IO initialization
│   │   ├── config/
│   │   │   ├── env.ts                   # Environment variables & runtime defaults
│   │   │   └── database.ts              # MongoDB Atlas connection & fallback initialization
│   │   ├── models/
│   │   │   ├── Trip.ts                  # Trip mission schema (Leg 1 & Leg 2)
│   │   │   ├── Hospital.ts              # Hospital registry & capacity schema
│   │   │   ├── Ambulance.ts             # Fleet unit schema
│   │   │   ├── TrafficIncident.ts       # Live congestion & roadblock incident schema
│   │   │   └── LocalStore.ts            # High-performance in-memory / JSON file fallback
│   │   ├── controllers/
│   │   │   ├── tripController.ts        # Trip lifecycle, dispatch, rerouting approval
│   │   │   ├── hospitalController.ts    # Hospital discovery & decision matrix query
│   │   │   ├── trafficController.ts     # Traffic congestion feed & incident triggers
│   │   │   └── analyticsController.ts  # Historical query & performance metrics proxy
│   │   ├── routes/
│   │   │   ├── tripRoutes.ts
│   │   │   ├── hospitalRoutes.ts
│   │   │   ├── trafficRoutes.ts
│   │   │   ├── analyticsRoutes.ts
│   │   │   └── healthRoutes.ts
│   │   ├── services/
│   │   │   ├── routingClient.ts         # HTTP client communicating with Python FastAPI service
│   │   │   ├── socketService.ts         # WebSocket event dispatcher & room manager
│   │   │   └── geocodingService.ts      # Nominatim OSM geocoding with caching
│   │   └── middleware/
│   │       ├── errorHandler.ts
│   │       └── requestLogger.ts
│   └── tests/
│       └── backend.test.ts
│
├── routing_service/                     # Python + FastAPI + NetworkX + Pandas
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── .env.example
│   ├── main.py                          # FastAPI application & lifespan events
│   ├── core/
│   │   ├── config.py                    # App settings (host, port, thresholds)
│   │   └── graph_manager.py             # NetworkX road network graph builder & loader
│   ├── algorithms/
│   │   ├── dijkstra.py                  # Multi-destination Dijkstra implementation
│   │   ├── astar.py                     # Heuristic A* pathfinder with Haversine distance
│   │   └── rerouting.py                 # Dynamic rerouting engine with threshold evaluation
│   ├── traffic/
│   │   ├── congestion_model.py          # Dynamic edge weight calculator (speeds, congestion factor)
│   │   └── lane_analyzer.py             # Lane-level occupancy & clearance vision analyzer
│   ├── analytics/
│   │   ├── trip_profiler.py             # Pandas/NumPy analysis of trip logs & duration variance
│   │   └── pattern_detector.py          # Congestion hotspot identification & bottleneck ranking
│   ├── data/
│   │   ├── bangalore_network.json       # Seed road graph for Bengaluru demonstration (MG Road/Indiranagar/Whitefield)
│   │   ├── davanagere_network.json      # Seed road graph for Davanagere GMIT regional corridor
│   │   └── hospitals_seed.json          # Seed hospital database with real coordinates and specialties
│   └── tests/
│       ├── test_graph.py
│       ├── test_dijkstra.py
│       └── test_astar.py
│
├── frontend/                            # React.js + Vite + Tailwind CSS + Leaflet
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   ├── Navbar.tsx               # Top navigation & system status pill
│       │   ├── MapView.tsx              # Leaflet map container with OpenStreetMap tiles
│       │   ├── DispatchModal.tsx        # Emergency incident creation modal
│       │   ├── DriverConsole.tsx        # In-transit cockpit with high-contrast UI
│       │   ├── HospitalMatrix.tsx       # Hospital comparison cards & recommendation badge
│       │   ├── RouteInfoCard.tsx        # Route distance, ETA, congestion color legend
│       │   ├── LaneVisionCard.tsx       # Camera/telemetry lane clearance widget
│       │   ├── RerouteAlertModal.tsx    # Dynamic reroute prompt (time saved, accept/dismiss)
│       │   └── AnalyticsDashboard.tsx   # Recharts charts (Golden Hour, efficiency, bottlenecks)
│       ├── hooks/
│       │   ├── useSocket.ts             # Socket.IO connection & event subscription hook
│       │   └── useTripState.ts          # Central trip state management
│       ├── services/
│       │   ├── api.ts                   # Axios / fetch wrapper for REST backend
│       │   └── geocoding.ts             # Client-side address lookup helper
│       ├── types/
│       │   └── index.ts                 # TypeScript interfaces for Trip, Hospital, Route, Leg
│       └── utils/
│           └── formatters.ts            # Time, distance, and speed formatting helpers
│
└── package.json                         # Root package.json for monorepo dev orchestration
```

---

## 2. Phase-by-Phase Module Implementation Strategy

### Phase 1: Foundation & Data Architecture (Days 1–2)
1. **Initialize Root Monorepo & Configuration:**
   - Establish root scripts to run `backend`, `routing_service`, and `frontend` concurrently.
   - Configure environment templates (`.env.example`) across all services.
2. **Setup Seed Geospatial Graphs & Medical Facilities:**
   - Define canonical Bengaluru demonstration corridor (MG Road $\rightarrow$ Indiranagar $\rightarrow$ Whitefield/Old Airport Road/Koramangala) and Davanagere regional corridor.
   - Seed candidate hospital registry with real GPS coordinates, bed capacities (ER & ICU), and verified emergency specializations (Manipal Hospital, Apollo Hospital, Narayana Health, City Care Hospital, etc.).
3. **Database Repositories & Hybrid Fallback Engine:**
   - Implement MongoDB schemas using Mongoose.
   - Implement in-memory/JSON local fallback (`LocalStore.ts`) guaranteeing seamless development and testing even without active MongoDB Atlas network credentials.

### Phase 2: Python FastAPI Routing & Graph Engine (Days 3–4)
1. **NetworkX Road Graph Loader:**
   - Load directional graph with node coordinates (latitude, longitude) and edge lengths.
   - Implement dynamic weight calculation incorporating base free-flow speed, road class multiplier, and real-time congestion coefficient.
2. **Dijkstra & A\* Implementation:**
   - Implement single-source multi-destination Dijkstra solver for simultaneous hospital reachability evaluation.
   - Implement Haversine-guided $A^*$ pathfinder for fast point-to-point ambulance routing and reroute recalculation.
3. **Dynamic Rerouting Engine:**
   - Implement trigger evaluator: if incident edge is on active path or delay $\Delta T \ge 3 \text{ min}$, calculate alternate path and quantify time-saved delta.
4. **Lane-Level Congestion Module:**
   - Ingest lane occupancy data (modeled on YOLOv8/DeepSORT tracking framework) and compute lane clearance recommendations.

### Phase 3: Node.js Orchestrator & Real-Time Event Bus (Days 5–6)
1. **Trip Lifecycle State Machine:**
   - Coordinate Leg 1 (Ambulance $\rightarrow$ Patient) and Leg 2 (Patient $\rightarrow$ Hospital).
   - REST endpoints for trip dispatch, status advance, hospital selection, and incident reporting.
2. **FastAPI RPC Proxy Integration:**
   - Seamlessly delegate route calculation and hospital suitability matrix to FastAPI service.
3. **Socket.IO Event Hub:**
   - Rooms per trip (`trip:${tripId}`).
   - Real-time broadcasts: position updates, status transitions, traffic congestion spikes, reroute alerts.

### Phase 4: Frontend Map, Dispatch & Driver Cockpit (Days 7–9)
1. **Leaflet OpenStreetMap Visualization:**
   - Interactive map with custom SVG markers for Ambulance (pulsing emergency vehicle), Patient (SOS marker), and Hospitals (medical cross).
   - Multi-leg polyline rendering with dynamic color coding: Green (clear), Amber (moderate), Red (congested).
2. **Dispatch & Intake Console:**
   - Address geocoding with instant coordinate lookup and click-on-map coordinate selection.
   - Patient condition and emergency type selector.
3. **Driver Cockpit & In-Transit Navigation:**
   - High-contrast cockpit with turn-by-turn instruction, remaining ETA, travel distance, current speed.
   - Real-time reroute notification banner with audio/visual alert and "Accept Reroute" button.
4. **Hospital Multi-Criteria Decision Matrix:**
   - Real-time hospital cards sorted by travel time, bed availability, and specialty matching.

### Phase 5: Trip Analytics & Post-Mission Audit (Days 10–11)
1. **Historical Telemetry Logging:**
   - Persist completed trip records with planned ETA, actual transit duration, delay bottlenecks, and reroute events.
2. **Pandas/NumPy Aggregation Pipeline:**
   - Compute Golden Hour compliance rate, duration variance, route efficiency index, and recurring delay hotspots.
3. **Recharts Visual Dashboards:**
   - Interactive bar charts (Planned vs. Actual Duration), pie charts (Emergency Type Distribution), and bottleneck ranking table.

### Phase 6: System Verification, Testing & Polish (Days 12–14)
1. **Automated Unit & Integration Tests:**
   - Python tests for graph algorithms and routing accuracy.
   - Backend API tests for trip creation, state transitions, and hospital ranking.
   - Frontend component tests.
2. **Live Demonstration Scenarios:**
   - Pre-packaged demo scenario: Ambulance at MG Road, Patient at Indiranagar, sudden congestion spike on Old Airport Road, automated rerouting to alternative corridor, delivery to City Care Hospital / Apollo.

---

## 3. Risk Mitigation & Sensible Defaults

| Potential Issue | Default Architectural Decision |
|---|---|
| **MongoDB Atlas connection failure** | Automatic, zero-configuration local JSON storage fallback (`LocalStore`) initialized on startup. |
| **OpenStreetMap Nominatim rate limits** | In-memory geocoding cache + pre-resolved coordinate lookup for key city landmarks + click-on-map coordinate selection. |
| **Python environment variance** | Standard `requirements.txt` with locked versions compatible with Python 3.10 through 3.14. |
| **Windows script execution restrictions** | Explicit use of `npm.cmd` and `python` runner scripts to avoid PowerShell execution policy issues. |
| **Simulated vs. Real Data Transparency** | All UI elements and API payloads strictly tag data provenance with a `source` flag (`real_osm_network`, `calculated_estimate`, `telemetry_stream`). |
