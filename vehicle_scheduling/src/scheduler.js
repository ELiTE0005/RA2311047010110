/**
 * 0/1 Knapsack Problem Solver using Dynamic Programming
 *
 * Problem:
 *   Given a set of vehicle maintenance tasks, each with a Duration (weight) and
 *   Impact score (value), and a depot's MechanicHours (capacity), find the
 *   subset of tasks that maximises total Impact without exceeding total Duration.
 *
 * Time Complexity:  O(n * W)  where n = number of tasks, W = mechanic hours
 * Space Complexity: O(n * W)  for the DP table (can be reduced to O(W) if only
 *                             the max value is needed, but we track selected items)
 *
 * @param {Array<{TaskID: string, Duration: number, Impact: number}>} tasks
 * @param {number} capacity - Total available mechanic hours
 * @returns {{
 *   selectedTasks: Array<{TaskID, Duration, Impact}>,
 *   totalImpact: number,
 *   totalDuration: number,
 *   utilizationPercent: string
 * }}
 */
function knapsack(tasks, capacity) {
  const n = tasks.length;

  // Guard: empty tasks or zero capacity
  if (n === 0 || capacity <= 0) {
    return {
      selectedTasks: [],
      totalImpact: 0,
      totalDuration: 0,
      utilizationPercent: '0.00',
    };
  }

  // Build DP table
  // dp[i][w] = max impact using first i tasks with w mechanic-hours available
  const dp = Array.from({ length: n + 1 }, () => new Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    const task = tasks[i - 1];
    const { Duration: weight, Impact: value } = task;

    for (let w = 0; w <= capacity; w++) {
      // Option 1: Skip this task
      dp[i][w] = dp[i - 1][w];

      // Option 2: Include this task (only if it fits)
      if (weight <= w) {
        const withTask = dp[i - 1][w - weight] + value;
        if (withTask > dp[i][w]) {
          dp[i][w] = withTask;
        }
      }
    }
  }

  // Backtrack to find selected tasks
  const selectedTasks = [];
  let w = capacity;
  for (let i = n; i > 0; i--) {
    // If value changed, this task was included
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedTasks.push(tasks[i - 1]);
      w -= tasks[i - 1].Duration;
    }
  }

  // Compute totals
  const totalImpact = selectedTasks.reduce((sum, t) => sum + t.Impact, 0);
  const totalDuration = selectedTasks.reduce((sum, t) => sum + t.Duration, 0);
  const utilizationPercent = capacity > 0
    ? ((totalDuration / capacity) * 100).toFixed(2)
    : '0.00';

  return {
    selectedTasks: selectedTasks.reverse(), // restore original order
    totalImpact,
    totalDuration,
    utilizationPercent,
  };
}

/**
 * Runs the knapsack optimiser for each depot independently against the
 * shared global vehicle task list.
 *
 * @param {Array<{ID: number, MechanicHours: number}>} depots
 * @param {Array<{TaskID: string, Duration: number, Impact: number}>} vehicles
 * @returns {Array<DepotSchedule>}
 */
function scheduleAllDepots(depots, vehicles) {
  return depots.map((depot) => {
    const result = knapsack(vehicles, depot.MechanicHours);
    return {
      depotId: depot.ID,
      mechanicHoursBudget: depot.MechanicHours,
      ...result,
    };
  });
}

module.exports = { knapsack, scheduleAllDepots };
