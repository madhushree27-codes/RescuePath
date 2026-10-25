export interface ICoordinates {
  name: string;
  lat: number;
  lng: number;
}

export interface IRouteInstruction {
  instruction: string;
  distanceMeters: number;
}

export interface IRouteSegment {
  fromNode: string;
  toNode: string;
  roadName: string;
  lengthMeters: number;
  speedKmh: number;
  congestionLevel: "CLEAR" | "MODERATE" | "CONGESTED";
}

export interface IRouteLeg {
  description: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  actualDurationMinutes?: number;
  trafficDelayMinutes: number;
  congestionLevel: "CLEAR" | "MODERATE" | "CONGESTED";
  waypoints: [number, number][];
  instructions: IRouteInstruction[];
  segments?: IRouteSegment[];
  pathNodes?: string[];
}

export interface IRerouteEvent {
  rerouteId: string;
  timestamp: string;
  triggerReason: string;
  timeSavedMinutes: number;
  previousEtaMinutes: number;
  newEtaMinutes: number;
  acceptedByDriver: boolean;
}

export interface ICandidateHospital {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  distanceKm: number;
  travelTimeMinutes: number;
  suitabilityScore: number;
  icuBedsAvailable: number;
  erBedsAvailable: number;
  hasMatchingSpecialty: boolean;
  recommended: boolean;
}

export type TripStatus =
  | "DISPATCHED"
  | "EN_ROUTE_TO_PATIENT"
  | "AT_PATIENT_LOCATION"
  | "EN_ROUTE_TO_HOSPITAL"
  | "ARRIVED_AT_HOSPITAL"
  | "COMPLETED"
  | "CANCELLED";

export interface ITrip {
  id: string;
  createdAt: string;
  emergencyType: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  status: TripStatus;
  callerNotes?: string;
  ambulanceLocation: ICoordinates;
  patientLocation: ICoordinates;
  selectedHospital?: ICandidateHospital;
  leg1: IRouteLeg;
  leg2?: IRouteLeg;
  candidateHospitals: ICandidateHospital[];
  rerouteHistory: IRerouteEvent[];
  activeLeg: "LEG1" | "LEG2" | "COMPLETED";
  currentLocation?: {
    lat: number;
    lng: number;
    speedKmh: number;
    lastUpdated: string;
  };
  timestamps: {
    dispatchedAt: string;
    arrivedAtPatientAt?: string;
    departedPatientAt?: string;
    arrivedAtHospitalAt?: string;
    completedAt?: string;
  };
  metrics?: {
    totalPlannedMinutes: number;
    totalActualMinutes: number;
    durationVarianceMinutes: number;
    routeEfficiencyScore: number;
    goldenHourCompliant: boolean;
  };
}

export interface ILaneAnalysis {
  junctionId: string;
  junctionName: string;
  timestamp: string;
  source: string;
  lanes: {
    laneNumber: number;
    description: string;
    occupancyPercent: number;
    status: "CLEAR" | "MODERATE" | "CONGESTED";
    vehicleCount: number;
    avgSpeedKmh: number;
  }[];
  recommendedLane: number;
  recommendedAction: string;
}

export interface ITrafficIncident {
  id: string;
  roadName: string;
  severity: "LOW" | "MODERATE" | "HEAVY_CONGESTION" | "COMPLETE_BLOCK";
  delayFactor: number;
  description: string;
  lat: number;
  lng: number;
  active: boolean;
  reportedAt: string;
}

export interface IAnalyticsSummary {
  totalTripsRecorded: number;
  averageDurationMinutes: number;
  averagePlannedMinutes: number;
  averageDurationVarianceMinutes: number;
  averageRouteEfficiency: number;
  goldenHourComplianceRatePercent: number;
  rerouteSuccessRatePercent: number;
}
