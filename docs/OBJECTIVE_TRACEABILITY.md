# RescuePath: Objective Traceability Matrix (OTM)
**Document Version:** 1.0.0  
**Project Title:** RescuePath: Adaptive Ambulance Routing with Real-Time Decision Support  
**Institution:** Department of Computer Science & Engineering, GM Institute of Technology (GMIT), Davanagere  
**Affiliation:** Visvesvaraya Technological University (VTU), Belagavi  
**Authors:** Madhushree N [4GM23CS039], Dhanya S V [4GM23CS025], Deepa C M [4GM23CS024], Padmavati S A [4GM23CS055]  
**Guide:** Dr. Chethan Chandra S Basavaraddi  

---

## 1. Overview & Verification Protocol

This Objective Traceability Matrix (OTM) establishes bi-directional alignment between the academic objectives articulated in the VTU/GMIT Project Synopsis (Chapters 4, 5, 7, and 9) and the physical components, services, database models, algorithms, and automated test cases implemented in the codebase.

---

## 2. Objective Traceability Matrix

| Obj # | Objective Title & Synopsis Ref | Frontend Component | Backend / Service Logic | Data Source & Provenance | Verification Test Case | Current Implementation Status |
|---|---|---|---|---|---|---|
| **OBJ-1** | **Optimal & Efficient Route Calculation**<br>*(Synopsis Ch. 4, Obj 1; Ch. 5, Scope 1; Ch. 7, Fig 7.1)* | `MapView.tsx`<br>`RouteInfoCard.tsx` | `routing_service/algorithms/astar.py`<br>`backend/services/routingClient.ts` | OpenStreetMap road network graph with dynamic edge weighting $W(e)$ | `tests/test_astar.py::test_optimal_path_calculation` | **Architecture Specified & Seed Network Created** *(Lovable demo previously used static polyline; now replaced with NetworkX A* engine)* |
| **OBJ-2** | **Alternative & Less-Congested Route Selection**<br>*(Synopsis Ch. 4, Obj 2; Ch. 5, Scope 2; Ch. 7, Fig 7.1)* | `RouteComparisonCards.tsx`<br>`MapView.tsx` (multi-color polylines) | `routing_service/algorithms/astar.py`<br>`traffic/congestion_model.py` | Edge speed impedance telemetry & road classification factors | `tests/test_astar.py::test_alternative_route_generation` | **Architecture Specified & Multi-route Schema Ready** *(Computes primary + bypass alternative with time delta)* |
| **OBJ-3** | **Lane-Level Congestion & Clearance Support**<br>*(Synopsis Ch. 4, Obj 2; Ch. 5, Scope 2; Literature Ch. 3)* | `LaneVisionCard.tsx`<br>`DriverConsole.tsx` | `routing_service/traffic/lane_analyzer.py`<br>`backend/routes/trafficRoutes.ts` | Micro-level lane occupancy feed (modeled on YOLOv8/DeepSORT detection telemetry) | `tests/test_lane.py::test_lane_occupancy_clearance` | **Architecture Specified & Simulated Telemetry Model Ready** *(Distinguishes macro road vs. micro lane clearance)* |
| **OBJ-4** | **Dynamic Route Recalculation & In-Transit Updates**<br>*(Synopsis Ch. 4, Obj 3; Ch. 5, Scope 3; Ch. 7, Fig 7.2)* | `RerouteAlertModal.tsx`<br>`DriverConsole.tsx` | `routing_service/algorithms/rerouting.py`<br>`backend/services/socketService.ts` | Real-time traffic incident events & vehicle telemetry stream | `tests/test_reroute.py::test_congestion_threshold_reroute` | **Architecture Specified & Socket.IO Engine Designed** *(Triggers reroute alert when delay delta $\ge 3$ min)* |
| **OBJ-5** | **Multi-Criteria Hospital Selection (Not Just Nearest)**<br>*(Synopsis Ch. 7, Step 5; Ch. 9, Fig 9.1; Literature Ch. 3)* | `HospitalMatrix.tsx`<br>`HospitalCard.tsx` | `routing_service/algorithms/dijkstra.py`<br>`backend/controllers/hospitalController.ts` | Dijkstra travel time matrix + Hospital ER/ICU bed registry | `tests/test_dijkstra.py::test_hospital_suitability_matrix` | **Architecture Specified & Scoring Matrix Formulated** *(Combines live ETA, ICU beds, ER capacity & specialty match)* |
| **OBJ-6** | **Driver-Friendly Cockpit & Minimal Distraction Interface**<br>*(Synopsis Ch. 4, Obj 4; Ch. 5, Scope 4; Ch. 7, Fig 7.2)* | `DriverConsole.tsx`<br>`ManeuverHUD.tsx` | `backend/services/socketService.ts`<br>`backend/controllers/tripController.ts` | High-contrast UI state, turn-by-turn guidance cache | `frontend/tests/DriverConsole.test.tsx` | **Architecture Specified & Component Contracts Established** *(Oversized controls, high contrast, one-tap actions)* |
| **OBJ-7** | **Trip Logging, Delay Variance & Pattern Analysis**<br>*(Synopsis Ch. 4, Obj 5; Ch. 5, Scope 5; Ch. 7, Fig 7.3)* | `AnalyticsDashboard.tsx`<br>`BottleneckTable.tsx` | `routing_service/analytics/trip_profiler.py`<br>`backend/controllers/analyticsController.ts` | MongoDB / LocalStore historical trip records | `tests/test_profiler.py::test_duration_variance_calculation` | **Architecture Specified & Schema Defined** *(Logs planned vs. actual duration, delays, and waypoints)* |
| **OBJ-8** | **Comprehensive Dashboards, Reports & Charts**<br>*(Synopsis Ch. 7, Step 7; Ch. 9, Fig 9.1; Tools Ch. 6)* | `AnalyticsDashboard.tsx`<br>`RechartsWidgets.tsx` | `backend/routes/analyticsRoutes.ts`<br>`routing_service/analytics/trip_profiler.py` | Pandas aggregated metrics (Golden Hour compliance, efficiency) | `tests/test_analytics.py::test_aggregate_kpis` | **Architecture Specified & Recharts Integration Defined** *(Interactive bar charts, pie breakdowns, and KPI pills)* |
| **OBJ-9** | **Complete Dual-Leg Workflow (Ambulance $\rightarrow$ Patient $\rightarrow$ Hospital)**<br>*(Synopsis Ch. 7, Fig 7.1, 7.2; Project Mandate Sec. 3)* | `DispatchModal.tsx`<br>`TripWorkflowStepper.tsx` | `backend/controllers/tripController.ts`<br>`backend/models/Trip.ts` | 3 distinct locations (Ambulance, Patient, Hospital) + 2 route legs | `tests/test_workflow.py::test_two_leg_lifecycle` | **Architecture Specified & State Machine Modelled** *(Full lifecycle: DISPATCHED $\rightarrow$ PATIENT $\rightarrow$ HOSPITAL $\rightarrow$ COMPLETE)* |

---

## 3. Data Provenance & Realism Disclosures

In accordance with strict academic integrity and engineering standards:
1. **Road Network Graph:** Constructed from real OpenStreetMap topological junction coordinates for the core Bengaluru corridor (MG Road, Halasuru, Indiranagar, Domlur, HAL Old Airport Road, Marathahalli, Whitefield).
2. **Hospital Registry:** Features real medical institutions in the corridor (Manipal Hospital Old Airport Rd, Apollo Medical Center, Sakra World Hospital, Narayana Multispeciality, City Care Hospital Whitefield) with documented trauma capabilities.
3. **Traffic Feeds:** Incorporates an extensible traffic impedance pipeline. When live external commercial API keys (Google Maps Traffic API / TomTom) are absent, the system executes deterministic edge delay factors and interactive incident injection.
4. **Lane-Level Data:** Demonstrates the computer vision integration schema (based on YOLOv8/DeepSORT lane count models referenced in Synopsis Chapter 3) via structured telemetry streaming.
