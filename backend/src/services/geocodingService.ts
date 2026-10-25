import axios from "axios";

// Comprehensive catalog of landmarks across Karnataka (Davanagere, Bengaluru, Mysuru, Hubballi, Belagavi, Mangaluru, etc.)
const KNOWN_COORDINATES: Record<string, { lat: number; lng: number; displayName: string }> = {
  // Davanagere
  "gmit": { lat: 14.4644, lng: 75.9218, displayName: "GMIT Campus, Davanagere" },
  "davanagere": { lat: 14.4644, lng: 75.9218, displayName: "Davanagere City Center, Karnataka" },
  "davangere": { lat: 14.4644, lng: 75.9218, displayName: "Davanagere City Center, Karnataka" },
  "hadadi road": { lat: 14.4580, lng: 75.9150, displayName: "Hadadi Road Circle, Davanagere" },
  "hadadi": { lat: 14.4580, lng: 75.9150, displayName: "Hadadi Road Circle, Davanagere" },
  "pb road": { lat: 14.4610, lng: 75.9180, displayName: "PB Road (Pune-Bangalore), Davanagere" },
  "bapuji hospital": { lat: 14.4720, lng: 75.9080, displayName: "Bapuji Hospital, MCC B Block, Davanagere" },
  "bapuji": { lat: 14.4720, lng: 75.9080, displayName: "Bapuji Hospital & Medical College, Davanagere" },
  "ssims": { lat: 14.4850, lng: 75.8920, displayName: "SSIMS & RC Hospital, NH-48 Bypass, Davanagere" },
  "chigateri": { lat: 14.4530, lng: 75.9230, displayName: "Chigateri District General Hospital, Davanagere" },
  "city central hospital": { lat: 14.4625, lng: 75.9250, displayName: "City Central Hospital, Mandipet, Davanagere" },
  "mandipet": { lat: 14.4625, lng: 75.9250, displayName: "Mandipet, Davanagere" },
  "pj extension": { lat: 14.4640, lng: 75.9160, displayName: "PJ Extension, Davanagere" },
  "mcc b block": { lat: 14.4680, lng: 75.9100, displayName: "MCC B Block, Davanagere" },
  "vidyanagar": { lat: 14.4550, lng: 75.9050, displayName: "Vidyanagar, Davanagere" },
  "shamanur": { lat: 14.4780, lng: 75.8980, displayName: "Shamanur / NH-48 Bypass, Davanagere" },

  // Bengaluru
  "mg road": { lat: 12.9756, lng: 77.6066, displayName: "MG Road Metro Station, Bengaluru" },
  "indiranagar": { lat: 12.9784, lng: 77.6408, displayName: "100 Feet Road, Indiranagar, Bengaluru" },
  "whitefield": { lat: 12.9698, lng: 77.7499, displayName: "Whitefield Main Road, Bengaluru" },
  "halasuru": { lat: 12.9772, lng: 77.6254, displayName: "Halasuru Lake, Bengaluru" },
  "domlur": { lat: 12.9608, lng: 77.6415, displayName: "Domlur Flyover, Bengaluru" },
  "marathahalli": { lat: 12.9562, lng: 77.7011, displayName: "Marathahalli Bridge, Bengaluru" },
  "trinity": { lat: 12.9729, lng: 77.6174, displayName: "Trinity Circle, Bengaluru" },
  "koramangala": { lat: 12.9352, lng: 77.6245, displayName: "Koramangala, Bengaluru" },
  "manipal hospital": { lat: 12.9592, lng: 77.6534, displayName: "Manipal Hospital, Old Airport Road, Bengaluru" },
  "apollo hospital": { lat: 12.9712, lng: 77.6412, displayName: "Apollo Medical Center, Indiranagar, Bengaluru" },

  // Other major Karnataka cities
  "mysore": { lat: 12.2958, lng: 76.6394, displayName: "Mysuru City Center, Karnataka" },
  "mysuru": { lat: 12.2958, lng: 76.6394, displayName: "Mysuru City Center, Karnataka" },
  "hubli": { lat: 15.3647, lng: 75.1240, displayName: "Hubballi City Center, Karnataka" },
  "hubballi": { lat: 15.3647, lng: 75.1240, displayName: "Hubballi City Center, Karnataka" },
  "belgaum": { lat: 15.8497, lng: 74.4977, displayName: "Belagavi City Center, Karnataka" },
  "belagavi": { lat: 15.8497, lng: 74.4977, displayName: "Belagavi City Center, Karnataka" },
  "mangaluru": { lat: 12.9141, lng: 74.8560, displayName: "Mangaluru City Center, Karnataka" },
  "mangalore": { lat: 12.9141, lng: 74.8560, displayName: "Mangaluru City Center, Karnataka" }
};

export async function geocodeAddress(query: string): Promise<{ success: boolean; lat?: number; lng?: number; displayName?: string; error?: string }> {
  if (!query || query.trim().length === 0) {
    return { success: false, error: "Location unavailable" };
  }

  const normalized = query.toLowerCase().trim();

  // Check known landmark dictionary
  for (const [key, value] of Object.entries(KNOWN_COORDINATES)) {
    if (normalized.includes(key)) {
      return { success: true, ...value };
    }
  }

  // Attempt Nominatim OpenStreetMap Geocoding
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: `${query}, Karnataka, India`,
        format: "json",
        limit: 1,
        addressdetails: 1
      },
      headers: {
        "User-Agent": "RescuePath-Emergency-Ambulance-Routing/1.0"
      },
      timeout: 3500
    });

    if (res.data && res.data.length > 0) {
      const match = res.data[0];
      return {
        success: true,
        lat: parseFloat(match.lat),
        lng: parseFloat(match.lon),
        displayName: match.display_name
      };
    }
  } catch (err: any) {
    console.warn("[Geocoding] Nominatim query error:", err.message);
  }

  // Try global search without suffix if specific search yielded nothing
  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: query,
        format: "json",
        limit: 1
      },
      headers: {
        "User-Agent": "RescuePath-Emergency-Ambulance-Routing/1.0"
      },
      timeout: 3500
    });

    if (res.data && res.data.length > 0) {
      const match = res.data[0];
      return {
        success: true,
        lat: parseFloat(match.lat),
        lng: parseFloat(match.lon),
        displayName: match.display_name
      };
    }
  } catch (err: any) {
    console.warn("[Geocoding] Global Nominatim query error:", err.message);
  }

  // Location not found!
  return {
    success: false,
    error: "Location unavailable"
  };
}
