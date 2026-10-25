# RescuePath: System Architecture & Design Specification
**Document Version:** 1.0.0  
**Project Title:** RescuePath: Adaptive Ambulance Routing with Real-Time Decision Support  
**Institution:** Department of Computer Science & Engineering, GM Institute of Technology (GMIT), Davanagere  
**Affiliation:** Visvesvaraya Technological University (VTU), Belagavi  
**Authors:** Madhushree N, Dhanya S V, Deepa C M, Padmavati S A  
**Guide:** Dr. Chethan Chandra S Basavaraddi  

---

## 1. Architectural Overview & System Decomposition

RescuePath is architected as a distributed, service-oriented system designed for real-time responsiveness, algorithmic rigor, and robust failover. The platform decouples user interaction, real-time message brokering, business workflow orchestration, and geospatial graph computation into dedicated tiers.

```mermaid
flowchart TB
    subgraph ClientTier ["Frontend Client Tier (React + Vite + Tailwind CSS)"]
        UI_Dispatch["Emergency Dispatch & Intake Console"]
        UI_Driver["Driver Navigation & Cockpit View"]
        UI_Map["Interactive Leaflet Map (OSM Tiles)"]
        UI_Hospital["Hospital Recommendation Matrix"]
        UI_Analytics["Trip Analytics & Heatmaps (Recharts)"]
        UI_Lane["Lane-Level Clearance Monitor"]
    end

    subgraph GatewayTier ["Backend API & Real-time Layer (Node.js + Express.js)"]
        API_Gateway["Express API Gateway & REST Controllers"]
        Socket_Server["Socket.IO Real-Time Event Bus"]
        State_Machine["Trip Mission State Engine (Leg 1 & Leg 2)"]
        Data_Adapter["Database Repository Layer (Mongoose / Local Store)"]
    end

    subgraph ServiceTier ["Routing & Analytical Service (Python + FastAPI)"]
        FastAPI_Core["FastAPI High-Performance Async Service"]
        Graph_Engine["Road Network Graph Engine (NetworkX)"]
        Router_Dijkstra["Dijkstra Multi-Destination Solver"]
        Router_AStar["A* Heuristic Optimal Path Calculator"]
        Traffic_Engine["Congestion Weighting & Lane Clearance Evaluator"]
        ML_Analytics["Trip Analytics & Congestion Profiler (Pandas/NumPy)"]
    end

    subgraph PersistenceTier ["Data Persistence Tier"]
        Mongo_DB[("MongoDB Atlas Primary Database")]
        Local_DB[("Configurable Local Development Fallback")]
    end

    subgraph ExternalServices ["External Geospatial & Telemetry Feeds"]
        OSM_Tiles["OpenStreetMap Tile Servers"]
        Nominatim["OSM Nominatim Geocoding API"]
        Traffic_Sensors["Simulated / Live Camera Telemetry & Road Feeds"]
    end

    %% Connections
    ClientTier <-->|REST APIs / JSON| API_Gateway
    ClientTier <-->|WebSocket Events| Socket_Server
    UI_Map <-->|Map Tiles| OSM_Tiles

    API_Gateway <-->|Internal HTTP RPC :8000| FastAPI_Core
    API_Gateway <--> Data_Adapter
    Data_Adapter <--> Mongo_DB
    Data_Adapter <--> Local_DB

    FastAPI_Core --> Graph_Engine
    Graph_Engine --> Router_Dijkstra
    Graph_Engine --> Router_AStar
    FastAPI_Core --> Traffic_Engine
    FastAPI_Core --> ML_Analytics

    API_Gateway --> Nominatim
    Traffic_Engine --> Traffic_Sensors
```

---

## 2. Component Design & Responsibility Matrix

### 2.1 Frontend Client Tier (React.js + Vite + Tailwind CSS)
- **Role:** Delivers a zero-latency, reactive single-page application (SPA) optimized for emergency dispatchers and in-vehicle ambulance tablets.
- **Key Modules:**
  - `MapComponent.tsx`: Interactive Leaflet map supporting multi-marker rendering (Ambulance, Patient, Candidate Hospitals), color-coded route polylines (Green/Amber/Red based on live congestion), turn arrows, and lane guidance overlays.
  - `EmergencyIntakeModal.tsx`: Fast intake form with address geocoding, patient severity classification, and emergency type matching.
  - `DriverCockpit.tsx`: Ergonomic, high-contrast console displaying next-turn instruction, distance to target, remaining ETA, real-time speed, lane clearance alerts, and instant reroute prompts.
  - `HospitalDecisionMatrix.tsx`: Comparative table and cards sorting candidate hospitals by live ETA, ICU/emergency bed availability, and specialized facilities.
  - `AnalyticsDashboard.tsx`: Interactive Recharts dashboard visualizing Golden Hour compliance, planned vs. actual transit durations, route efficiency scores, and recurring congestion heatmaps.
  - `LaneLevelVisionCard.tsx`: Visualizer displaying lane occupancy percentages and emergency shoulder status.

### 2.2 Backend Gateway & Orchestrator (Node.js + Express.js)
- **Role:** Handles authentication, API routing, business validations, persistence adapters, and bi-directional WebSocket broadcasting.
- **Key Subsystems:**
  - `TripController`: Manages lifecycle transitions: `DISPATCHED` $\rightarrow$ `EN_ROUTE_TO_PATIENT` $\rightarrow$ `AT_PATIENT_LOCATION` $\rightarrow$ `EN_ROUTE_TO_HOSPITAL` $\rightarrow$ `ARRIVED_AT_HOSPITAL` $\rightarrow$ `COMPLETED`.
  - `SocketService`: Manages WebSocket channels (`trip:join`, `trip:location_update`, `trip:reroute_alert`, `trip:traffic_change`, `trip:status_change`).
  - `HospitalController`: Manages hospital discovery, bed capacity updates, and specialty attributes.
  - `RoutingProxy`: Forwards complex routing, multi-destination queries, and dynamic reroute evaluations to the Python FastAPI engine over high-speed HTTP RPC.
  - `StorageAdapter`: Hybrid persistence layer that connects to MongoDB Atlas using Mongoose, automatically falling back to an in-memory/file-based local database if network or credentials are absent.

### 2.3 Geospatial Routing & Analytical Engine (Python + FastAPI)
- **Role:** High-performance mathematical computation, graph algorithm execution, traffic impedance weighting, and geospatial analytics.
- **Key Components:**
  - `RoadNetworkGraph`: Graph model $G=(V, E)$ constructed using NetworkX. Nodes represent road junctions and coordinate centroids; edges represent road links with physical attributes (length, lanes, speed limit, road classification).
  - `DijkstraSolver`: Single-source shortest path implementation used to evaluate costs from the patient pickup node to all candidate hospital destination nodes simultaneously.
  - `AStarSolver`: Goal-directed $A^*$ pathfinding using great-circle Haversine distance heuristic:
    $$f(n) = g(n) + h(n)$$
    $$h(n) = R \cdot c = 2R \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos \phi_1 \cos \phi_2 \sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
    guaranteeing admissibility and minimal node expansion during rapid reroute recalculations.
  - `DynamicTrafficModel`: Computes edge impedance $W(e, t)$ based on base travel time, real-time congestion factor $C \in [1.0, 4.5]$, lane availability factor $L$, and intersection delay $D$.
  - `LaneCongestionAnalyzer`: Micro-level lane analysis framework modeling vehicle density per lane (OpenCV / YOLOv8 / DeepSORT telemetry parser).
  - `AnalyticsProfiler`: Pandas and NumPy pipeline aggregating trip logs, computing variance between estimated and actual durations, identifying recurring delay bottlenecks, and generating summary metrics.

---

## 3. End-to-End Workflow Flowcharts

### 3.1 Core Workflow: Intelligent Routing & Hospital Selection (Synopsis Fig 7.1)
```mermaid
flowchart TD
    Start([START]) --> Step1["1. User Input (React.js)<br/>Enter Patient Location, Ambulance Origin & Emergency Type"]
    Step1 --> Step2["2. Fetch Real-time Data (Node.js API)<br/>• Nominatim Geocoding<br/>• Road Network Graph Nodes<br/>• Candidate Hospital Records & Capacities"]
    Step2 --> Step3["3. Process Data (Python FastAPI)<br/>Clean Coordinates, Map to Graph Nodes, Apply Traffic Impairment"]
    Step3 --> Step4["4. Route Computation (Dijkstra / A*)<br/>• Leg 1: Ambulance → Patient<br/>• Candidate Leg 2 Paths: Patient → Multiple Hospitals"]
    Step4 --> Step5["5. Hospital Evaluation Matrix<br/>Compute Composite Suitability Score:<br/>Travel Time + ER/ICU Beds + Specialty Match"]
    Step5 --> Step6["6. Display Results (React.js Dashboard)<br/>• Selected Hospital (Lowest ETA & Available Capacity)<br/>• Dual-Leg Optimal Route on Leaflet Map<br/>• Color-Coded Congestion Segments"]
    Step6 --> End([END])
```

### 3.2 Dynamic Rerouting & In-Transit Decision Support (Synopsis Fig 7.2)
```mermaid
flowchart TD
    StartNav([Start Navigation]) --> LoadRoute["1. Load Active Route (Ambulance → Patient → Hospital)"]
    LoadRoute --> PollData["2. Telemetry Ingestion (Node.js + Python)<br/>Ingest Live Speed, Road Segment Congestion & Incidents"]
    PollData --> DetectCongestion{"3. Congestion Detected?<br/>Δ ETA on Current Route ≥ Threshold (3 min)"}
    
    DetectCongestion -- "No" --> ContinueRoute["4A. Continue Current Route<br/>Update Progress & ETA Broadcast"]
    ContinueRoute --> RefreshLoop["Wait Next Update Cycle (15s)"]
    RefreshLoop --> PollData
    
    DetectCongestion -- "Yes" --> Recalculate["4B. Recalculate Alternative Route<br/>(A* Pathfinder on Updated Edge Weights)"]
    Recalculate --> CompareETA{"Is Alternative Route<br/>Faster than Current Delay?"}
    CompareETA -- "No" --> ContinueRoute
    CompareETA -- "Yes" --> EmitAlert["5. Emit Reroute Alert via Socket.IO<br/>Broadcast New Route, ETA & Time Saved"]
    EmitAlert --> DriverAction["6. Driver Cockpit Display<br/>Show Reroute Banner & New Polyline"]
    DriverAction --> AcceptReroute{"Driver Accepts Reroute?"}
    AcceptReroute -- "Yes" --> UpdateActiveRoute["Update Active Route to Alternative"]
    AcceptReroute -- "No" --> KeepCurrentRoute["Keep Current Route (Logged in Audit)"]
    UpdateActiveRoute --> RefreshLoop
    KeepCurrentRoute --> RefreshLoop
```

### 3.3 Post-Trip Analysis & Performance Audit (Synopsis Fig 7.3)
```mermaid
flowchart TD
    TripComplete([Trip Completed]) --> IngestLog["1. Collect Trip Telemetry (MongoDB / Local Store)<br/>Waypoints, Timestamps, Reroutes, Delays, Final Duration"]
    IngestLog --> Preprocess["2. Data Processing (Python Pandas & NumPy)<br/>Clean GPS Logs, Filter Signal Outliers, Compute Segment Speeds"]
    Preprocess --> PerformanceMetrics["3. Calculate Key Performance Indicators:<br/>• Total Trip Duration (Planned ETA vs. Actual)<br/>• Golden Hour Compliance (≤ 60 min total)<br/>• Route Efficiency Ratio = Free-flow Time / Actual Time<br/>• Identified Delay Hotspots & Congestion Duration"]
    PerformanceMetrics --> PatternDetection["4. Congestion Pattern & Machine Learning Profiling<br/>Correlate Delays with Time of Day, Junction IDs, Weather"]
    PatternDetection --> DashboardViz["5. Visualize on Analytics Dashboard (Recharts)<br/>• Monthly Golden Hour Compliance Gauge<br/>• Planned vs. Actual Time Variance Bar Chart<br/>• Bottleneck Ranking Table"]
    DashboardViz --> PersistentReport["6. Store Generated Report & Audit Insights in DB"]
    PersistentReport --> EndAudit([Audit Complete])
```

---

## 4. Multi-Leg Emergency Mission Architecture

The system natively models the mandatory three-location, two-leg mission geometry:

```
[AMBULANCE ORIGIN] 
       │ 
       ▼ (Leg 1: Route Leg A - Dispatch to Scene)
[PATIENT INCIDENT LOCATION] (Triage, Patient Loading)
       │
       ▼ (Leg 2: Route Leg B - Patient to Definite Care)
[SELECTED DESTINATION HOSPITAL]
```

### Leg 1: Ambulance Origin $\rightarrow$ Patient Pickup
- Primary Objective: Minimize response time ($T_{\text{pickup}}$) to reach the patient.
- Algorithm: Goal-directed $A^*$ algorithm targeting the patient's coordinates.
- Route Status: `EN_ROUTE_TO_PATIENT`.
- Transitions to `AT_PATIENT_LOCATION` when GPS geofence ($\le 50 \text{ meters}$) or manual driver confirmation is triggered.

### Leg 2: Patient Pickup $\rightarrow$ Selected Hospital
- Primary Objective: Transport the stabilized patient to the most medically appropriate facility within the Golden Hour.
- Candidate Selection: Simultaneous Dijkstra path search from the patient node to all candidate hospitals within the service radius.
- Decision Matrix: Evaluates $ETA_h$, available ICU/ER beds, and specialty capabilities for emergency type $E_{\text{type}}$.
- Route Status: `EN_ROUTE_TO_HOSPITAL`.
- Transitions to `ARRIVED_AT_HOSPITAL` and then `COMPLETED`.

---

## 5. Fault Tolerance & Fallback Strategy

| Subsystem Failure | Failure Mode | Automated Fallback Mechanism |
|---|---|---|
| **MongoDB Atlas Unreachable** | Connection timeout / offline development | Seamless in-memory & local file persistence layer initializes automatically without crashing. |
| **Python Routing Engine Down** | Process crash / network disconnect | Node.js backend switches to a built-in lightweight Dijkstra/Haversine routing heuristic with cached road network edges. |
| **External Traffic API Down** | Rate limit / network error | Dynamic traffic model uses deterministic historical time-of-day multipliers and simulated live incident generator. |
| **Nominatim Geocoding Down** | HTTP 503 / network timeout | Fallback to local coordinate cache and interactive map click-to-pin mode for coordinate selection. |
| **Socket.IO Disconnection** | Mobile network drops in transit | Client automatically reconnects with exponential backoff and polls REST `/api/trips/:id` for state synchronization. |
