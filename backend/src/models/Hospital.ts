export interface IHospital {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  nearestNodeId: string;
  contactPhone: string;
  traumaLevel: "LEVEL_1" | "LEVEL_2" | "LEVEL_3" | "GENERAL";
  rating: number;
  capacity: {
    totalEmergencyBeds: number;
    availableEmergencyBeds: number;
    totalIcuBeds: number;
    availableIcuBeds: number;
    status: "OPEN" | "BUSY" | "CRITICAL_CAPACITY" | "DIVERT";
  };
  specialties: {
    cardiology: boolean;
    traumaSurgery: boolean;
    neurologyStroke: boolean;
    pediatricEmergency: boolean;
    burnCare: boolean;
    cathLabAvailable: boolean;
  };
}
