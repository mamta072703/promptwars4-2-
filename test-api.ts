import assert from "assert";
import { readStadiumData, writeStadiumData } from "./stadium-db.js";
import { StadiumData } from "./types.js";

function runTests() {
  console.log("==========================================");
  console.log("🏃 RUNNING SMART STADIUM ASSISTANT TEST SUITE");
  console.log("==========================================");

  // Test 1: Load Stadium Data
  try {
    console.log("🧪 Test 1: Reading stadium data...");
    const data = readStadiumData();
    assert.ok(data, "Stadium data should be successfully loaded");
    assert.strictEqual(data.stadiumInfo.tournament, "FIFA World Cup 2026", "Tournament should be FIFA World Cup 2026");
    assert.ok(Array.isArray(data.gates), "Gates must be an array");
    assert.ok(data.gates.length > 0, "Gates array should not be empty");
    console.log("🟢 Test 1 Passed: Stadium data successfully read and typed.");
  } catch (error: any) {
    console.error("🔴 Test 1 Failed:", error.message);
    process.exit(1);
  }

  // Test 2: Update Entity Status (simulation)
  try {
    console.log("🧪 Test 2: Simulating operational updates (Gate Closure / Crowd Toggling)...");
    const data = readStadiumData();
    const originalGate3Status = data.gates.find(g => g.id === "gate-3")?.status;
    const originalGate2Density = data.gates.find(g => g.id === "gate-2")?.crowdDensity;

    // Toggle Gate 3 Status and Gate 2 Density
    const modifiedGates = data.gates.map((g) => {
      if (g.id === "gate-3") return { ...g, status: "open" as const };
      if (g.id === "gate-2") return { ...g, crowdDensity: "low" as const };
      return g;
    });

    const updatedData: StadiumData = { ...data, gates: modifiedGates };
    const success = writeStadiumData(updatedData);
    assert.strictEqual(success, true, "Writing updated data should return true");

    // Verify written values
    const verifiedData = readStadiumData();
    const newGate3 = verifiedData.gates.find(g => g.id === "gate-3");
    const newGate2 = verifiedData.gates.find(g => g.id === "gate-2");

    assert.strictEqual(newGate3?.status, "open", "Gate 3 should now be open");
    assert.strictEqual(newGate2?.crowdDensity, "low", "Gate 2 crowd density should now be low");

    // Revert to original data to preserve state
    const restoredGates = verifiedData.gates.map((g) => {
      if (g.id === "gate-3") return { ...g, status: originalGate3Status || "closed" as const };
      if (g.id === "gate-2") return { ...g, crowdDensity: originalGate2Density || "high" as const };
      return g;
    });
    writeStadiumData({ ...verifiedData, gates: restoredGates });

    console.log("🟢 Test 2 Passed: DB writes and state toggles operate perfectly.");
  } catch (error: any) {
    console.error("🔴 Test 2 Failed:", error.message);
    process.exit(1);
  }

  // Test 3: Grounding Prompt Formulation Check
  try {
    console.log("🧪 Test 3: Validating grounding context schema integrity...");
    const data = readStadiumData();
    const hasRestrooms = data.restrooms.some(r => r.crowdDensity === "high");
    assert.ok(hasRestrooms, "Should have restrooms with high crowd density for grounding scenarios");
    
    // Check if food stalls cover different dietary options
    const diets = data.foodStalls.flatMap(fs => fs.dietaryFlags);
    assert.ok(diets.includes("vegetarian"), "Grounding data must contain vegetarian options");
    assert.ok(diets.includes("halal"), "Grounding data must contain halal options");
    console.log("🟢 Test 3 Passed: Grounding context schema has all required simulation flags.");
  } catch (error: any) {
    console.error("🔴 Test 3 Failed:", error.message);
    process.exit(1);
  }

  // Test 4: Edge Scenarios & Closed Gates Integrity
  try {
    console.log("🧪 Test 4: Running edge scenarios integrity validation...");
    const data = readStadiumData();

    // Verify there is a temporarily closed gate to test detour routing
    const closedGate = data.gates.find(g => g.status === "closed");
    assert.ok(closedGate, "Grounding data must contain at least one closed gate for simulation testing");
    assert.strictEqual(closedGate.id, "gate-3", "Gate 3 should be marked as closed");

    // Verify fallback detour alternatives exist in the open gates pool
    const openGates = data.gates.filter(g => g.status === "open");
    assert.ok(openGates.length >= 2, "There must be alternative open gates for detour guidance");
    console.log("🟢 Test 4 Passed: Edge scenarios and closed-gate routing parameters are fully verified.");
  } catch (error: any) {
    console.error("🔴 Test 4 Failed:", error.message);
    process.exit(1);
  }

  // Test 5: Accessibility Grounding Coverage
  try {
    console.log("🧪 Test 5: Running accessibility-routing metadata checking...");
    const data = readStadiumData();

    // Ensure dedicated wheelchair and elderly-friendly routes are configured
    assert.ok(Array.isArray(data.accessibilityRoutes), "Accessibility routes must be configured as an array");
    assert.ok(data.accessibilityRoutes.length > 0, "At least one accessibility route must exist");
    
    const wheelchairRoute = data.accessibilityRoutes.find(r => r.accessibleFor.includes("wheelchair"));
    assert.ok(wheelchairRoute, "Should contain at least one wheelchair accessible route");
    assert.ok(wheelchairRoute.path.toLowerCase().includes("elevator") || wheelchairRoute.path.toLowerCase().includes("no stairs"), "Accessibility paths must be descriptive and stair-free");

    console.log("🟢 Test 5 Passed: Accessibility routing metadata is correct and highly detailed.");
  } catch (error: any) {
    console.error("🔴 Test 5 Failed:", error.message);
    process.exit(1);
  }

  // Test 6: Transportation and Sustainability Pillars Validation
  try {
    console.log("🧪 Test 6: Validating Transportation (Transit Hubs) and Sustainability (Eco Stops)...");
    const data = readStadiumData();

    // Transit Hub validations
    assert.ok(Array.isArray(data.transitHubs), "Transit Hubs array must be defined");
    assert.ok(data.transitHubs.length > 0, "At least one active Transit Hub must be configured");
    const trainStation = data.transitHubs.find(t => t.id === "transit-1");
    assert.ok(trainStation, "NJ Transit Station should exist");
    assert.strictEqual(trainStation.crowdDensity, "high", "NJ Transit crowd density should be high");

    // Sustainability Stop validations
    assert.ok(Array.isArray(data.sustainabilityStops), "Sustainability Stops array must be defined");
    assert.ok(data.sustainabilityStops.length > 0, "At least one active Sustainability Stop must be configured");
    const refillStation = data.sustainabilityStops.find(s => s.id === "eco-2");
    assert.ok(refillStation, "Water bottle refill station should exist");
    assert.ok(refillStation.features.some(f => f.toLowerCase().includes("water")), "Refill features must contain water reference");

    console.log("🟢 Test 6 Passed: Transportation and Sustainability data schemas verified.");
  } catch (error: any) {
    console.error("🔴 Test 6 Failed:", error.message);
    process.exit(1);
  }

  console.log("==========================================");
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! ✅");
  console.log("==========================================");
}

runTests();
