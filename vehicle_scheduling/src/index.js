require('dotenv').config();
const express = require('express');
const { getAuthToken, fetchDepots, fetchVehicles } = require('./apiClient');
const { scheduleAllDepots } = require('./scheduler');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'vehicle-maintenance-scheduler',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// GET /schedule
// Fetches depots + vehicles, runs knapsack per
// depot, returns the optimised schedule.
// ─────────────────────────────────────────────
app.get('/schedule', async (req, res) => {
  console.log('\n[Schedule] Request received at', new Date().toISOString());

  try {
    // Step 1: Authenticate
    console.log('[Schedule] Authenticating with evaluation server...');
    const token = await getAuthToken();
    console.log('[Schedule] Authentication successful.');

    // Step 2: Fetch data in parallel
    console.log('[Schedule] Fetching depots and vehicles...');
    const [depots, vehicles] = await Promise.all([
      fetchDepots(token),
      fetchVehicles(token),
    ]);
    console.log(`[Schedule] Fetched ${depots.length} depots, ${vehicles.length} vehicle tasks.`);

    // Step 3: Run optimiser
    console.log('[Schedule] Running knapsack optimiser for each depot...');
    const schedules = scheduleAllDepots(depots, vehicles);

    // Step 4: Build response
    const response = {
      success: true,
      generatedAt: new Date().toISOString(),
      summary: {
        totalDepots: depots.length,
        totalVehicleTasks: vehicles.length,
      },
      depotSchedules: schedules.map((s) => ({
        depotId: s.depotId,
        mechanicHoursBudget: s.mechanicHoursBudget,
        totalImpact: s.totalImpact,
        totalDuration: s.totalDuration,
        budgetUtilization: `${s.utilizationPercent}%`,
        tasksScheduled: s.selectedTasks.length,
        selectedTasks: s.selectedTasks,
      })),
    };

    // Log summary
    console.log('\n===== SCHEDULE SUMMARY =====');
    schedules.forEach((s) => {
      console.log(
        `Depot ${s.depotId} | Budget: ${s.mechanicHoursBudget}h | ` +
        `Used: ${s.totalDuration}h (${s.utilizationPercent}%) | ` +
        `Impact: ${s.totalImpact} | Tasks: ${s.selectedTasks.length}`
      );
    });
    console.log('============================\n');

    res.json(response);
  } catch (error) {
    console.error('[Schedule] Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ─────────────────────────────────────────────
// GET /schedule/:depotId
// Returns the optimised schedule for a single depot.
// ─────────────────────────────────────────────
app.get('/schedule/:depotId', async (req, res) => {
  const depotId = parseInt(req.params.depotId, 10);
  if (isNaN(depotId)) {
    return res.status(400).json({ success: false, error: 'Invalid depotId' });
  }

  console.log(`\n[Schedule] Request for depot ${depotId} at`, new Date().toISOString());

  try {
    const token = await getAuthToken();
    const [depots, vehicles] = await Promise.all([
      fetchDepots(token),
      fetchVehicles(token),
    ]);

    const depot = depots.find((d) => d.ID === depotId);
    if (!depot) {
      return res.status(404).json({
        success: false,
        error: `Depot with ID ${depotId} not found`,
      });
    }

    const [schedule] = scheduleAllDepots([depot], vehicles);

    res.json({
      success: true,
      generatedAt: new Date().toISOString(),
      depotId: schedule.depotId,
      mechanicHoursBudget: schedule.mechanicHoursBudget,
      totalImpact: schedule.totalImpact,
      totalDuration: schedule.totalDuration,
      budgetUtilization: `${schedule.utilizationPercent}%`,
      tasksScheduled: schedule.selectedTasks.length,
      selectedTasks: schedule.selectedTasks,
    });
  } catch (error) {
    console.error('[Schedule] Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET /depots  - raw depot data
// GET /vehicles - raw vehicle task data
// ─────────────────────────────────────────────
app.get('/depots', async (req, res) => {
  try {
    const token = await getAuthToken();
    const depots = await fetchDepots(token);
    res.json({ success: true, totalDepots: depots.length, depots });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/vehicles', async (req, res) => {
  try {
    const token = await getAuthToken();
    const vehicles = await fetchVehicles(token);
    res.json({ success: true, totalVehicles: vehicles.length, vehicles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('=====================================================');
  console.log('  Vehicle Maintenance Scheduler Microservice');
  console.log(`  Server running at http://localhost:${PORT}`);
  console.log('=====================================================');
  console.log('  Endpoints:');
  console.log(`    GET /health          - Health check`);
  console.log(`    GET /schedule        - Full schedule (all depots)`);
  console.log(`    GET /schedule/:id    - Schedule for one depot`);
  console.log(`    GET /depots          - Raw depot list`);
  console.log(`    GET /vehicles        - Raw vehicle task list`);
  console.log('=====================================================\n');
});

module.exports = app;
