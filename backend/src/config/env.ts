import dotenv from "dotenv";
dotenv.config();

export const config = {
  PORT: process.env.PORT || 5000,
  ROUTING_SERVICE_URL: process.env.ROUTING_SERVICE_URL || "http://localhost:8000",
  MONGODB_URI: process.env.MONGODB_URI || "",
  NODE_ENV: process.env.NODE_ENV || "development"
};
