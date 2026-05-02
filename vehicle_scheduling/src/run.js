/**
 * Vehicle Maintenance Scheduler - Standalone Runner
 *
 * This script fetches live data from the evaluation server,
 * runs the 0/1 Knapsack optimiser for each depot, and prints
 * a detailed schedule to the console.
 *
 * Run with: node src/run.js
 */

require('dotenv').config();
const { getAuthToken, fetchDepots, fetchVehicles } = require('./apiClient');
const { scheduleAllDepots } = require('./scheduler');

// ANSI colour helpers
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  white: '\x1b[37m',
  dim: '\x1b[2m',
};

function banner(text) {
  const line = '═'.repeat(70);
  console.log(`\n${c.cyan}${line}${c.reset}`);
  console.log(`${c.bold}${c.cyan}  ${text}${c.reset}`);
  console.log(`${c.cyan}${line}${c.reset}`);
}

function printDepotSchedule(s) {
  console.log(
    `\n${c.bold}${c.blue}╔══ Depot ${s.depotId} ${'═'.repeat(55)}${c.reset}`
  );
  console.log(
    `${c.blue}║${c.reset}  Budget  : ${c.yellow}${s.mechanicHoursBudget} mechanic-hours${c.reset}`
  );
  console.log(
    `${c.blue}║${c.reset}  Used    : ${c.green}${s.totalDuration}h (${s.utilizationPercent}%)${c.reset}`
  );
  console.log(
    `${c.blue}║${c.reset}  Impact  : ${c.magenta}${s.totalImpact}${c.reset}`
  );
  console.log(
    `${c.blue}║${c.reset}  Tasks   : ${c.white}${s.selectedTasks.length} selected${c.reset}`
  );

  if (s.selectedTasks.length > 0) {
    console.log(`${c.blue}║${c.reset}`);
    console.log(`${c.blue}║${c.reset}  ${c.dim}${'─'.repeat(62)}${c.reset}`);
    console.log(
      `${c.blue}║${c.reset}  ${c.bold}${'#'.padEnd(4)} ${'Task ID'.padEnd(38)} ${'Dur'.padEnd(5)} ${'Impact'.padEnd(6)}${c.reset}`
    );
    console.log(`${c.blue}║${c.reset}  ${c.dim}${'─'.repeat(62)}${c.reset}`);

    s.selectedTasks.forEach((t, i) => {
      console.log(
        `${c.blue}║${c.reset}  ${String(i + 1).padEnd(4)} ${t.TaskID.padEnd(38)} ${String(t.Duration).padEnd(5)} ${String(t.Impact).padEnd(6)}`
      );
    });
    console.log(`${c.blue}║${c.reset}  ${c.dim}${'─'.repeat(62)}${c.reset}`);
  } else {
    console.log(`${c.blue}║${c.reset}  ${c.dim}No tasks fit within the budget.${c.reset}`);
  }

  console.log(`${c.blue}╚${'═'.repeat(63)}${c.reset}`);
}

async function main() {
  banner('Vehicle Maintenance Scheduler  |  Knapsack Optimiser');

  try {
    // ── 1. Authenticate ──────────────────────────────────────────────
    console.log(`\n${c.dim}[1/3] Authenticating with evaluation server...${c.reset}`);
    const token = await getAuthToken();
    console.log(`${c.green}      ✓ Authentication successful${c.reset}`);

    // ── 2. Fetch data ────────────────────────────────────────────────
    console.log(`${c.dim}[2/3] Fetching depots and vehicle tasks...${c.reset}`);
    const [depots, vehicles] = await Promise.all([
      fetchDepots(token),
      fetchVehicles(token),
    ]);
    console.log(`${c.green}      ✓ ${depots.length} depots fetched${c.reset}`);
    console.log(`${c.green}      ✓ ${vehicles.length} vehicle tasks fetched${c.reset}`);

    // Print raw vehicle data overview
    console.log(`\n${c.bold}Vehicle Tasks (${vehicles.length} total):${c.reset}`);
    console.log(`${c.dim}${'─'.repeat(56)}${c.reset}`);
    console.log(
      `${c.bold}${'#'.padEnd(4)} ${'Task ID'.padEnd(38)} ${'Dur'.padEnd(5)} ${'Impact'.padEnd(6)}${c.reset}`
    );
    console.log(`${c.dim}${'─'.repeat(56)}${c.reset}`);
    vehicles.forEach((v, i) => {
      console.log(
        `${String(i + 1).padEnd(4)} ${v.TaskID.padEnd(38)} ${String(v.Duration).padEnd(5)} ${String(v.Impact)}`
      );
    });
    console.log(`${c.dim}${'─'.repeat(56)}${c.reset}`);

    // ── 3. Optimise ──────────────────────────────────────────────────
    console.log(`\n${c.dim}[3/3] Running 0/1 Knapsack optimiser for ${depots.length} depots...${c.reset}`);
    const schedules = scheduleAllDepots(depots, vehicles);
    console.log(`${c.green}      ✓ Optimisation complete${c.reset}`);

    // ── 4. Print results ─────────────────────────────────────────────
    banner('Optimal Maintenance Schedules by Depot');
    schedules.forEach(printDepotSchedule);

    // ── 5. Global summary ────────────────────────────────────────────
    const totalImpact = schedules.reduce((s, d) => s + d.totalImpact, 0);
    const totalHoursUsed = schedules.reduce((s, d) => s + d.totalDuration, 0);
    const totalBudget = schedules.reduce((s, d) => s + d.mechanicHoursBudget, 0);
    const totalTasks = schedules.reduce((s, d) => s + d.selectedTasks.length, 0);

    banner('Global Summary');
    console.log(`  ${c.bold}Total Depots          :${c.reset} ${depots.length}`);
    console.log(`  ${c.bold}Total Vehicle Tasks   :${c.reset} ${vehicles.length}`);
    console.log(`  ${c.bold}Tasks Scheduled       :${c.reset} ${totalTasks}`);
    console.log(`  ${c.bold}Mechanic Hours Budget :${c.reset} ${totalBudget}h`);
    console.log(`  ${c.bold}Mechanic Hours Used   :${c.reset} ${totalHoursUsed}h (${((totalHoursUsed / totalBudget) * 100).toFixed(2)}%)`);
    console.log(`  ${c.bold}${c.magenta}Total Impact Score    : ${totalImpact}${c.reset}`);
    console.log(`\n${c.dim}Algorithm: 0/1 Knapsack Dynamic Programming  |  O(n × W) complexity${c.reset}\n`);

  } catch (err) {
    console.error(`\n${c.bold}\x1b[31m[ERROR]${c.reset} ${err.message}`);
    process.exit(1);
  }
}

main();
