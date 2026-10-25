# RescuePath: Adaptive Ambulance Routing with Real-Time Decision Support

**Institution:** Department of Computer Science & Engineering, GM Institute of Technology (GMIT), Davanagere  
**Affiliation:** Visvesvaraya Technological University (VTU), Belagavi, Karnataka  
**Academic Year:** 2025–2026  
**Guiding Faculty:** Dr. Chethan Chandra S Basavaraddi  
**Student Team:** Madhushree N [4GM23CS039], Dhanya S V [4GM23CS025], Deepa C M [4GM23CS024], Padmavati S A [4GM23CS055]  

---

## 1. Overview & Project Objectives

RescuePath is an intelligent geospatial routing and decision-support platform designed to reduce emergency medical vehicle transit delays during the critical "Golden Hour". It replaces conventional static shortest-path GPS apps with dynamic, congestion-aware multi-leg navigation and multi-criteria hospital selection.

### Key Objectives Implemented:
1. **Intelligent Dual-Leg Route Calculation:** A* heuristic search and Dijkstra algorithm operating on a topological road network graph $G = (V, E)$.
2. **Multi-Criteria Hospital Selection:** Compares candidate medical facilities by dynamic Estimated Travel Time (ETT), ICU and Emergency Room bed availability, trauma level, and clinical specialty matching (cardiac, stroke, trauma, pediatric) rather than naive distance.
3. **Dynamic Rerouting Engine:** Real-time event monitoring that recalculates faster alternative corridors when active route congestion exceeds the delay threshold ($\Delta T \ge 3 \text{ min}$).
4. **Lane-Level Congestion & Clearance Telemetry:** Micro-level lane occupancy analysis (modeled on YOLOv8/DeepSORT tracking framework) guiding drivers toward open passing corridors.
5. **High-Contrast Driver Cockpit:** Minimal-distraction HUD with large legible turn instructions, speed, remaining ETA, and one-tap mission progression controls.
6. **Post-Trip Performance Auditing:** Historical trip analytics powered by Pandas and NumPy visualizing Golden Hour compliance rate, duration variance, and recurring bottleneck hotspots using Recharts.

---

## 2. System Architecture

- **Frontend (`frontend/`):** React.js (Vite) + Tailwind CSS + Leaflet.js + OpenStreetMap + Recharts (Port 3000).
- **API Gateway & Real-Time Layer (`backend/`):** Node.js + Express.js + Socket.IO (Port 5000).
- **Routing & Analytical Engine (`routing_service/`):** Python + FastAPI + NetworkX + Pandas + NumPy + Scikit-learn (Port 8000).
- **Persistence Tier:** MongoDB Atlas with zero-configuration in-memory/JSON local fallback (`LocalStore`).

```
[Leaflet Frontend :3000] <=== WebSocket / REST ===> [Node.js Gateway :5000] <=== RPC ===> [FastAPI Routing Service :8000]
                                                            │                                       │
                                                            ▼                                       ▼
                                                [MongoDB / Local Store]                  [NetworkX Road Network Graph]
```

---

## 3. Quick Start & Execution

### Option A: One-Click Launcher (Windows)
Double-click `start_all.bat` in the project root. It will open three terminal windows running the Python service, Node.js gateway, and React frontend concurrently.

### Option B: Manual Execution

#### 1. Routing & Analytical Microservice (Python)
```bash
cd routing_service
python main.py
# Server runs on http://localhost:8000 (Swagger docs at http://localhost:8000/docs)
```

#### 2. Backend API Gateway (Node.js)
```bash
cd backend
npm start
# Server runs on http://localhost:5000
```

#### 3. Frontend Client (React)
```bash
cd frontend
npm run dev
# Accessible at http://localhost:3000
```

---

## 4. Automated Testing & Demo Mission Script

To verify all 9 project objectives in a single automated end-to-end mission simulation:
```bash
python routing_service/tests/demo_mission_flow.py
```

To run algorithmic unit tests:
```bash
python routing_service/tests/test_routing_engine.py
```

---

## 5. Project Documentation Directory

- `docs/PROJECT_REQUIREMENTS.md` - Complete functional and non-functional requirements.
- `docs/SYSTEM_ARCHITECTURE.md` - System decomposition, Mermaid flowcharts, and failover design.
- `docs/IMPLEMENTATION_PLAN.md` - Monorepo structure, phases, and seed datasets.
- `docs/API_SPECIFICATION.md` - Comprehensive REST endpoints and Socket.IO events.
- `docs/DATA_MODEL.md` - Entity schemas for Trips, Hospitals, Ambulances, and Incidents.
- `docs/OBJECTIVE_TRACEABILITY.md` - Traceability matrix mapping synopsis objectives to code and tests.
