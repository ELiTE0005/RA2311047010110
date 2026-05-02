# Notification System Design

## Overview

The Notification System is a scalable, event-driven architecture designed to deliver real-time and scheduled notifications to depot managers and fleet operators within the Vehicle Maintenance Scheduler platform.

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Client Layer                               │
│          Web App / Mobile App / Admin Dashboard                    │
└──────────────────────────┬─────────────────────────────────────────┘
                           │ REST / WebSocket
┌──────────────────────────▼─────────────────────────────────────────┐
│                      API Gateway                                   │
│          Rate Limiting · Auth Middleware · Routing                 │
└──────────────┬───────────────────────────────┬──────────────────────┘
               │                               │
┌──────────────▼──────────────┐  ┌─────────────▼──────────────────────┐
│   Notification Service      │  │   Maintenance Scheduler Service    │
│  (Node.js / Express)        │  │   (Knapsack Optimizer)             │
│  · Create Notification      │  │   · Fetch Depots & Vehicles        │
│  · Fetch Notifications      │  │   · Run DP Optimization            │
│  · Mark as Read             │  │   · Emit Events on Schedule        │
└──────────────┬──────────────┘  └─────────────┬──────────────────────┘
               │                               │
               └──────────────┬────────────────┘
                              │ Publishes Events
              ┌───────────────▼────────────────┐
              │       Message Queue            │
              │   (Redis Pub/Sub / RabbitMQ)   │
              └───────────────┬────────────────┘
                              │
        ┌─────────────────────┼──────────────────────┐
        │                     │                      │
┌───────▼──────┐   ┌──────────▼──────────┐  ┌───────▼──────────────┐
│  Email Worker │   │ Push Notification   │  │  SMS Worker          │
│  (Nodemailer) │   │ Worker (FCM/APNs)   │  │  (Twilio/AWS SNS)    │
└───────────────┘   └─────────────────────┘  └──────────────────────┘
```

---

## Key Components

### 1. Notification Service
- **Technology**: Node.js + Express.js
- **Responsibilities**:
  - Expose REST APIs for CRUD on notifications
  - Handle WebSocket connections for real-time push
  - Persist notifications in PostgreSQL
  - Publish notification events to the message queue

### 2. Message Queue
- **Technology**: Redis Pub/Sub (or RabbitMQ for enterprise scale)
- **Purpose**: Decouples event producers (Maintenance Scheduler) from consumers (Email/SMS/Push workers)
- **Patterns**: Topic-based routing, Dead Letter Queue for failed deliveries

### 3. Notification Workers
| Channel | Technology | Use Case |
|---------|-----------|----------|
| Email | Nodemailer + SendGrid | Maintenance schedules, daily reports |
| Push | Firebase Cloud Messaging (FCM) | Real-time alerts for depot managers |
| SMS | Twilio / AWS SNS | Critical vehicle downtime alerts |
| In-App | WebSocket (Socket.io) | Live dashboard updates |

### 4. Database (Persistence)
- **Technology**: PostgreSQL
- **Schema**:
```sql
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  depot_id      INTEGER NOT NULL,
  type          VARCHAR(50) NOT NULL,  -- 'maintenance_scheduled', 'budget_exceeded', 'task_completed'
  message       TEXT NOT NULL,
  metadata      JSONB,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  read_at       TIMESTAMPTZ
);
```

---

## Notification Types

| Type | Trigger | Channel | Priority |
|------|---------|---------|----------|
| `maintenance_scheduled` | Optimal task set computed for depot | Email + In-App | Medium |
| `budget_exceeded` | Tasks exceed mechanic-hour limit | Email + SMS | High |
| `task_completed` | Vehicle maintenance completed | In-App | Low |
| `high_impact_task` | Impact score > threshold detected | Push + Email | High |
| `daily_summary` | End of day cron job | Email | Low |

---

## API Design

### POST /notifications
Create a new notification.

**Request Body:**
```json
{
  "depotId": 1,
  "type": "maintenance_scheduled",
  "message": "Depot 1: 5 tasks scheduled with total impact 47, using 58/60 hours.",
  "metadata": {
    "tasksSelected": ["task-uuid-1", "task-uuid-2"],
    "totalImpact": 47,
    "totalHours": 58
  }
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "depotId": 1,
  "type": "maintenance_scheduled",
  "message": "...",
  "isRead": false,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET /notifications?depotId=1
Fetch all notifications for a depot.

### PATCH /notifications/:id/read
Mark a notification as read.

---

## Scalability Considerations

1. **Horizontal Scaling**: Notification workers are stateless and can be scaled independently via container orchestration (Kubernetes).
2. **Rate Limiting**: API Gateway enforces per-depot rate limits to prevent notification flooding.
3. **Retry Logic**: Failed notifications are sent to a Dead Letter Queue with exponential backoff (3 retries).
4. **Idempotency**: Each notification event has a unique `eventId` to prevent duplicate deliveries.
5. **Caching**: Redis caches unread notification counts per depot (TTL: 60 seconds).

---

## Security

- All API endpoints protected with Bearer token authentication
- Notification payloads encrypted at rest (AES-256)
- PII (email, phone) masked in logs
- GDPR compliance: notifications purged after 90 days

---

## Monitoring & Observability

- **Metrics**: Prometheus + Grafana (delivery rate, failure rate, latency P99)
- **Logging**: Structured JSON logs via Winston, shipped to ELK stack
- **Alerting**: PagerDuty integration for delivery failures > 5%
- **Tracing**: OpenTelemetry distributed tracing across services

---

## Tech Stack Summary

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express.js |
| Message Queue | Redis Pub/Sub |
| Database | PostgreSQL 15 |
| Real-time | Socket.io |
| Email | Nodemailer + SendGrid |
| SMS | Twilio |
| Push | Firebase Admin SDK |
| Containerization | Docker + Docker Compose |
| Orchestration | Kubernetes (production) |
