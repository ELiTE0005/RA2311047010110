# Vehicle Maintenance Scheduler Microservice

A Node.js microservice that optimally schedules vehicle maintenance tasks for each depot using the **0/1 Knapsack Dynamic Programming** algorithm.

---

## Problem Statement

Each depot has a fixed **mechanic-hour budget**. Vehicle tasks have a **duration** (hours) and an **impact score** (operational importance). The goal is to select a subset of tasks that:

- **Does not exceed** the depot's mechanic-hour limit
- **Maximises** the total operational impact score

This is a classic **0/1 Knapsack Problem** solved efficiently with DP.

---

## Algorithm

```
0/1 Knapsack (Dynamic Programming)

Time  Complexity: O(n × W)
Space Complexity: O(n × W)

where n = number of vehicle tasks
      W = mechanic-hour budget per depot
```

**Why 0/1 Knapsack?**
- Each task is either included **once** or **not at all**
- Tasks cannot be split (you can't do half a maintenance job)
- Guarantees the **globally optimal** solution (not greedy approximation)

---

## Project Structure

```
vehicle_scheduling/
├── src/
│   ├── index.js       # Express REST API server
│   ├── run.js         # Standalone CLI runner (for screenshots)
│   ├── apiClient.js   # Auth + data fetching from evaluation server
│   └── scheduler.js   # Knapsack DP algorithm
├── .env.example       # Environment variable template
├── package.json
└── README.md
```

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in your credentials
cp .env.example .env

# 3. Run the standalone scheduler (prints results to console)
node src/run.js

# 4. Start the REST API server
npm start
# or for development with auto-reload:
npm run dev
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `GET` | `/schedule` | Optimal schedule for all depots |
| `GET` | `/schedule/:depotId` | Schedule for a specific depot |
| `GET` | `/depots` | Raw depot list from evaluation server |
| `GET` | `/vehicles` | Raw vehicle task list from evaluation server |

---

## Sample Response — `GET /schedule`

```json
{
  "success": true,
  "generatedAt": "2024-01-15T10:30:00.000Z",
  "summary": {
    "totalDepots": 5,
    "totalVehicleTasks": 28
  },
  "depotSchedules": [
    {
      "depotId": 1,
      "mechanicHoursBudget": 60,
      "totalImpact": 95,
      "totalDuration": 59,
      "budgetUtilization": "98.33%",
      "tasksScheduled": 12,
      "selectedTasks": [
        { "TaskID": "264e638f-...", "Duration": 1, "Impact": 5 },
        ...
      ]
    }
  ]
}
```

---

## Data Flow

```
Evaluation Server
      │
      ├── POST /auth          → Bearer Token
      ├── GET  /depots        → [{ ID, MechanicHours }]
      └── GET  /vehicles      → [{ TaskID, Duration, Impact }]
            │
            ▼
   Knapsack Optimiser (per depot)
            │
            ▼
   Optimal Task Schedule
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `CLIENT_EMAIL` | Your registered email |
| `CLIENT_NAME` | Your name (lowercase) |
| `CLIENT_ROLL_NO` | Your roll number |
| `CLIENT_ACCESS_CODE` | Access code from registration |
| `CLIENT_ID` | Client ID from registration |
| `CLIENT_SECRET` | Client Secret from registration |
| `PORT` | Server port (default: 3000) |
