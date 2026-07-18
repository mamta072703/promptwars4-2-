import fs from "fs";
import path from "path";
import { StadiumData } from "./types.js";

const DATA_FILE_PATH = path.join(process.cwd(), "src", "data", "stadium-data.json");

// In-memory cache to eliminate redundant disk-read operations on every incoming request
let cachedStadiumData: StadiumData | null = null;

/**
 * Reads stadium operational data. Uses the in-memory cache if available to optimize efficiency.
 * If cache is cold, performs a one-time disk read and parses the JSON context.
 */
export function readStadiumData(): StadiumData {
  if (cachedStadiumData) {
    return cachedStadiumData;
  }

  try {
    if (fs.existsSync(DATA_FILE_PATH)) {
      const dataStr = fs.readFileSync(DATA_FILE_PATH, "utf-8");
      cachedStadiumData = JSON.parse(dataStr) as StadiumData;
      return cachedStadiumData;
    }
  } catch (error) {
    console.error("Error reading stadium-data.json, returning hardcoded fallback:", error);
  }

  // Fallback structured data block
  const fallback: StadiumData = {
    stadiumInfo: {
      name: "MetLife Stadium, East Rutherford (NY/NJ Host City)",
      tournament: "FIFA World Cup 2026",
      capacity: 82500,
      generalRules: "Gates open 3 hours before kickoff. Clear bags only."
    },
    gates: [],
    restrooms: [],
    foodStalls: [],
    medicalPoints: [],
    accessibilityRoutes: [],
    transitHubs: [],
    sustainabilityStops: []
  };
  cachedStadiumData = fallback;
  return fallback;
}

/**
 * Saves updated stadium data to disk and immediately updates the in-memory cache to maintain coherence.
 */
export function writeStadiumData(data: StadiumData): boolean {
  try {
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(data, null, 2), "utf-8");
    // Synchronize cache immediately
    cachedStadiumData = data;
    return true;
  } catch (error) {
    console.error("Error writing stadium-data.json:", error);
    return false;
  }
}
