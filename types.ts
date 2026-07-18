export interface StadiumInfo {
  name: string;
  tournament: string;
  capacity: number;
  generalRules: string;
}

export interface Gate {
  id: string;
  name: string;
  location: string;
  status: "open" | "closed";
  crowdDensity: "low" | "medium" | "high";
  averageQueueTimeMinutes: number;
  wheelchairAccessible: boolean;
  directions: string;
}

export interface Restroom {
  id: string;
  name: string;
  location: string;
  gender: string;
  wheelchairAccessible: boolean;
  hasBabyChangingTable: boolean;
  crowdDensity: "low" | "medium" | "high";
  queueTimeMinutes: number;
}

export interface FoodStall {
  id: string;
  name: string;
  location: string;
  cuisine: string;
  dietaryFlags: string[];
  crowdDensity: "low" | "medium" | "high";
  status: "open" | "closed";
}

export interface MedicalPoint {
  id: string;
  name: string;
  location: string;
  accessibilityNotes: string;
  status: "active" | "inactive";
}

export interface TransitHub {
  id: string;
  name: string;
  location: string;
  status: "active" | "inactive";
  crowdDensity: "low" | "medium" | "high";
  waitTimeMinutes: number;
}

export interface SustainabilityStop {
  id: string;
  name: string;
  location: string;
  features: string[];
  crowdDensity: "low" | "medium" | "high";
}

export interface AccessibilityRoute {
  name: string;
  path: string;
  accessibleFor: string[];
}

export interface StadiumData {
  stadiumInfo: StadiumInfo;
  gates: Gate[];
  restrooms: Restroom[];
  foodStalls: FoodStall[];
  medicalPoints: MedicalPoint[];
  accessibilityRoutes: AccessibilityRoute[];
  transitHubs?: TransitHub[];
  sustainabilityStops?: SustainabilityStop[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot" | "system";
  text: string;
  timestamp: string;
}
