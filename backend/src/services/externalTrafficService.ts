import axios from "axios";
import { config } from "../config/env";

export interface ITrafficProviderStatus {
  configuredProvider: string;
  activeProvider: string;
  isLiveExternal: boolean;
  missingCredentials: string[];
  supportedProviders: string[];
  dataProvenance: string;
}

export const externalTrafficService = {
  async getProviderStatus(): Promise<ITrafficProviderStatus> {
    try {
      const res = await axios.get(`${config.ROUTING_SERVICE_URL}/traffic/provider-status`, {
        timeout: 2000
      });
      return res.data;
    } catch (err: any) {
      return {
        configuredProvider: "algorithmic",
        activeProvider: "algorithmic (NetworkX graph impedance model)",
        isLiveExternal: false,
        missingCredentials: ["TOMTOM_API_KEY", "GOOGLE_MAPS_API_KEY"],
        supportedProviders: ["tomtom", "google", "osrm", "algorithmic"],
        dataProvenance: "calculated_estimate"
      };
    }
  }
};
