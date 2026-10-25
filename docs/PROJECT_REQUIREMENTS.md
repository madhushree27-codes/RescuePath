# RescuePath: Project Requirements Specification
**Document Version:** 1.0.0  
**Project Title:** RescuePath: Adaptive Ambulance Routing with Real-Time Decision Support  
**Institution:** Department of Computer Science & Engineering, GM Institute of Technology (GMIT), Davanagere  
**Affiliation:** Visvesvaraya Technological University (VTU), Belagavi, Karnataka, India  
**Academic Year:** 2025–2026  
**Guiding Faculty:** Dr. Chethan Chandra S Basavaraddi (Associate Professor, Dept. of CSE)  
**Project Authors:** Madhushree N [4GM23CS039], Dhanya S V [4GM23CS025], Deepa C M [4GM23CS024], Padmavati S A [4GM23CS055]  

---

## 1. Executive Summary & Problem Formulation

### 1.1 The Golden Hour Crisis
In emergency medical services (EMS), the "Golden Hour" represents the first sixty minutes following trauma or acute illness during which definitive medical care must be initiated to prevent irreversible damage or mortality. Urban traffic congestion is the predominant barrier preventing emergency vehicles from achieving timely response times.

Ambulance drivers face several critical challenges in real-world urban environments (e.g., Bengaluru, Davanagere, Tier-1/Tier-2 Indian cities):
1. **Static and Blind Shortest-Path Routing:** Conventional GPS systems optimize for distance or static historical averages, frequently routing emergency vehicles through congested bottlenecks or narrow urban streets where emergency clearance is impossible.
2. **Nearest Hospital Fallacy:** Traditional navigation systems direct ambulances to the geographically closest hospital by Euclidean distance. However, the closest hospital may have a longer travel time due to severe gridlock, or may lack ICU beds, specialized trauma facilities, or cardiac catheterization labs required for the patient's specific emergency.
3. **Absence of Two-Leg Emergency Workflow:** An ambulance trip is fundamentally a three-location, two-leg mission:
   - **Leg 1 (Pickup Leg):** Ambulance Base / Current Location $\rightarrow$ Patient Incident Location.
   - **Leg 2 (Transit Leg):** Patient Incident Location $\rightarrow$ Selected Medical Facility.
   Most routing software considers only single origin-destination queries.
4. **Driver Cognitive Overload:** Complex consumer navigation apps require constant attention, manual zooming, and reading tiny text, causing dangerous distraction during high-speed emergency transit.
5. **Lack of Post-Incident Data & Accountability:** Most EMS providers lack structured trip recording, preventing retrospective analysis of route bottlenecks, ETA accuracy, and recurring delay patterns.

### 1.2 Proposed RescuePath Solution
RescuePath is an integrated, adaptive geospatial routing and decision-support platform designed specifically for emergency vehicle dispatch, dynamic navigation, intelligent hospital selection, and post-trip performance auditing. It combines graph algorithms (Dijkstra and A*), real-time traffic weighting, lane-level clearance awareness, dual-leg mission management, and automated rerouting.

---

## 2. Functional Requirements (FR)

### Module A: Emergency Creation & Trip Management
- **FR-A1: Emergency Incident Dispatch:**
  - The system shall capture incident metadata: emergency type (e.g., Cardiac Arrest, Severe Trauma, Respiratory Distress, Stroke, Obstetric, General Emergency), patient condition severity (Critical, High, Moderate, Low), contact number, caller notes, and timestamp.
  - The system shall support geocoded location input for both the Patient Location and Ambulance Origin (with automatic coordinate resolution via OpenStreetMap Nominatim and manual pin-drop fallback on the interactive Leaflet map).
- **FR-A2: Two-Leg Mission Tracking:**
  - The application shall manage the complete trip state machine:
    `DISPATCHED` $\rightarrow$ `EN_ROUTE_TO_PATIENT` $\rightarrow$ `AT_PATIENT_LOCATION` (Pickup/Triage) $\rightarrow$ `EN_ROUTE_TO_HOSPITAL` $\rightarrow$ `ARRIVED_AT_HOSPITAL` $\rightarrow$ `COMPLETED` (or `CANCELLED`).
  - The system shall compute and visualize Leg 1 (Ambulance $\rightarrow$ Patient) and Leg 2 (Patient $\rightarrow$ Selected Hospital) independently with distinct ETAs and turn-by-turn guidance.

### Module B: Intelligent Route Calculation & Graph Modeling
- **FR-B1: Road Network Graph Representation:**
  - The road network shall be represented as a directed graph $G = (V, E)$, where vertices $V$ denote road intersections, roundabouts, and key access nodes; edges $E$ denote traversable road segments.
  - Edge weights $W(e)$ shall be dynamically computed as:
    $$W(e) = \frac{\text{Length}(e)}{\text{FreeFlowSpeed}(e)} \times C_{\text{traffic}}(e) \times M_{\text{road\_type}}(e) + T_{\text{signal}}(e)$$
    where $C_{\text{traffic}}$ is the congestion multiplier, $M_{\text{road\_type}}$ prioritizes arterial/emergency corridors, and $T_{\text{signal}}$ accounts for intersection delays.
- **FR-B2: Routing Algorithm Implementation:**
  - **Dijkstra's Algorithm:** Used for comprehensive single-source multi-destination evaluations (e.g., evaluating travel costs to all candidate hospitals simultaneously).
  - **A\* Algorithm:** Used for point-to-point fast route calculation using Haversine/Euclidean distance as the admissible heuristic $h(n)$ to guarantee optimal pathfinding with reduced search space.
- **FR-B3: Alternative Route Generation:**
  - The engine shall compute and return at least 2 to 3 alternative candidate routes (e.g., Primary Optimal, Less-Congested Arterial Alternative, Bypass Corridor), highlighting distance, estimated duration under live traffic, and congestion index.

### Module C: Hospital Discovery & Multi-Criteria Selection
- **FR-C1: Dynamic Spatial Search:**
  - The system shall discover all registered medical facilities within an adjustable radius (5 km to 25 km) around the patient's pickup location.
- **FR-C2: Multi-Factor Decision Support Matrix:**
  - The system shall rank candidate hospitals using a composite suitability score $S_h$:
    $$S_h = w_1 \cdot \text{NormalizedETT}(h) + w_2 \cdot \text{CapacityScore}(h) + w_3 \cdot \text{SpecialtyMatch}(h) + w_4 \cdot \text{CongestionFactor}(h)$$
  - Factors must include:
    1. Real-time dynamic travel time (ETA) rather than static road distance.
    2. Emergency Department & ICU bed availability status.
    3. Specialty capability matching the emergency type (e.g., Cath Lab for cardiac arrest, Stroke Unit for neuro incidents, Level-1 Trauma for major accidents).
  - The dashboard shall visually designate the recommended hospital while allowing dispatchers/drivers to override the selection with reason logging.

### Module D: Driver Navigation & Dynamic Rerouting
- **FR-D1: High-Visibility Driver Console:**
  - The driver console must render key operational parameters at high contrast: live route line, next turn direction and distance, current leg ETA, total distance remaining, average speed, and real-time traffic status alert.
- **FR-D2: Dynamic Rerouting Engine:**
  - The system shall continuously monitor transit progress and active segment traffic conditions every 10–30 seconds.
  - If unexpected congestion or blockage is detected that increases the current route's remaining ETA by a threshold $\Delta T \ge 3 \text{ minutes}$, the system shall automatically calculate a faster alternative.
  - The system shall present an actionable reroute alert to the driver with the time saved and a simple one-click "Accept Reroute" button or automated fallback.

### Module E: Traffic Monitoring & Lane-Level Analysis
- **FR-E1: Macro-Level Road Congestion Monitoring:**
  - Segment traffic shall be classified into three standardized tiers:
    - **Clear / Normal:** Free flow speed $\ge 75\%$ of road speed limit (rendered in Green).
    - **Moderate:** Speed between $40\%$ and $74\%$ of limit; mild delays (rendered in Yellow/Amber).
    - **Congested:** Speed $< 40\%$ of limit; severe delay hazard (rendered in Red).
- **FR-E2: Lane-Level Clearance Awareness:**
  - The system shall ingest camera/sensor feeds or simulated lane-level occupancy telemetry (modeled after YOLOv8 vehicle detection and DeepSORT tracking concepts from literature).
  - The console shall indicate lane occupancy (e.g., Lane 1: Heavy, Lane 2: Moderate, Lane 3: Emergency Shoulder Clear) to assist the driver in anticipating lane clearance opportunities at major junctions.

### Module F: Trip History & Geospatial Analytics
- **FR-F1: Complete Trip Record Logging:**
  - Each completed trip shall store: Trip ID, emergency category, vehicle ID, timestamps (dispatch, pickup arrival, hospital arrival, completion), waypoints traversed, planned ETA vs. actual transit duration, delays encountered, reroutes triggered, and hospital selected.
- **FR-F2: Performance Metrics & Visual Dashboards:**
  - The analytics dashboard shall compute and visualize:
    - Average Response Time and Golden Hour Compliance Rate.
    - Planned vs. Actual Duration Variance (ETA accuracy).
    - Route Efficiency Ratio: $\text{Efficiency} = \frac{\text{Optimal Distance / Free-flow Duration}}{\text{Actual Duration}}$.
    - Congestion Bottleneck Heatmap and High-Delay Road Segments.
    - Historical trends using Recharts (bar charts, line trends, pie breakdown of emergency types).

### Module G: Administration & Configuration
- **FR-G1: System Configuration:**
  - Configurable parameters for default dispatch center coordinates (e.g., Davanagere or Bengaluru coordinates as demonstrated in synopsis), algorithm weights, rerouting thresholds, and simulated traffic congestion injection.
- **FR-G2: Hospital & Ambulance Fleet Management:**
  - CRUD operations for hospital profiles (name, location, emergency beds, ICU beds, specialties, contact) and ambulance fleet units (vehicle number, status, base location).

### Module H: Health Checks, Verification & Demonstration Support
- **FR-H1: Self-Test & Diagnostic Endpoints:**
  - Backend health check routes (`/api/health`, `/health`) verifying database connectivity, Python routing engine status, and Socket.IO connection.
- **FR-H2: Realistic Demonstration Scenarios:**
  - Pre-seeded demonstration scenarios replicating Bengaluru (MG Road $\rightarrow$ Indiranagar $\rightarrow$ Whitefield) and Davanagere urban corridors with simulated live traffic spikes to demonstrate dynamic rerouting in live reviews.

---

## 3. Non-Functional Requirements (NFR)

### 3.1 Performance & Latency
- **NFR-P1 (Route Calculation Latency):** Route calculation via A* or Dijkstra on the Python graph engine shall return within $< 400 \text{ ms}$ for typical metropolitan bounding boxes ($< 5,000$ nodes).
- **NFR-P2 (Dynamic Reroute Broadcast):** Reroute notifications and live vehicle position updates emitted over Socket.IO shall reach connected clients within $< 150 \text{ ms}$.
- **NFR-P3 (Map Rendering Performance):** The Leaflet map interface shall render markers, polylines, and popups at 60 FPS without UI jank or memory leaks during active tracking.

### 3.2 Usability & Ergonomics
- **NFR-U1 (Driver Cockpit Usability):** The driver console must feature oversized touch targets (minimum $48 \times 48 \text{ px}$), large legible typography, high contrast, and dark-mode compatibility to minimize cognitive load under high stress.
- **NFR-U2 (One-Click Operations):** Essential in-transit actions (Acknowledge Alert, Accept Reroute, Confirm Patient Pickup, Complete Trip) must require at most a single touch interaction.

### 3.3 Reliability & Availability
- **NFR-R1 (Graceful Degradation):** If real-time external traffic APIs are unavailable or credentials are missing, the system shall seamlessly fall back to local cached road graphs and deterministic estimation models without crashing.
- **NFR-R2 (Database Fallback):** The backend shall connect to MongoDB Atlas if `MONGODB_URI` is supplied; if not reachable or offline, it must gracefully support a local embedded/file-based development store (or SQLite) so the system remains 100% operational for student viva/demonstrations.

### 3.4 Security & Data Integrity
- **NFR-S1 (Sanitization & Validation):** All incoming API payloads (coordinates, patient metadata, emergency types) must be strictly validated using schema validators (Zod/Pydantic/Joi).
- **NFR-S2 (Credential Isolation):** All external keys and connection strings must reside exclusively in `.env` files and never be committed to source control.

---

## 4. Hardware and Software Specifications (from Synopsis Fig 6.1 & 6.2)

### 4.1 Hardware Requirements
| Component | Specification |
|---|---|
| Processing Unit | Intel Core i5 or higher (minimum quad-core 2.4 GHz) |
| System Memory | Minimum 8 GB RAM (16 GB recommended for concurrent services) |
| Storage | 256 GB SSD or higher |
| Network | Stable Broadband / Wi-Fi Internet connection |
| Input / Output | Display monitor (1920x1080), Keyboard, Mouse, Audio output for alerts |

### 4.2 Software Stack
| Layer / Category | Technology |
|---|---|
| Frontend Framework | React.js (v18+) with Vite, Tailwind CSS |
| UI Components & Icons | Lucide-react, Radix UI primitives, Recharts |
| Maps & Geospatial UI | Leaflet.js, React-Leaflet, OpenStreetMap Tile Service |
| Main Backend | Node.js (v18+ / v22), Express.js |
| Real-Time Communication | Socket.IO (Server & Client) |
| Routing & Analytics Engine | Python (v3.10+ / v3.14), FastAPI, Uvicorn |
| Graph Modeling & Algorithms | NetworkX, Custom Dijkstra & A* Pathfinders |
| Data Processing & ML | Pandas, NumPy, Scikit-learn |
| Computer Vision Module | OpenCV, YOLOv8 / DeepSORT (simulated/live lane stream) |
| Database & Persistence | MongoDB Atlas (Mongoose ODM) with SQLite / Local JSON fallback |
| Version Control | Git, GitHub |
