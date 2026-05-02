require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;

// In-memory notification store (replace with DB in production)
let notifications = [];
let nextId = 1;

/**
 * POST /notifications
 * Create a new notification
 */
app.post('/notifications', (req, res) => {
  const { depotId, type, message, metadata } = req.body;

  if (!depotId || !type || !message) {
    return res.status(400).json({
      success: false,
      error: 'depotId, type, and message are required',
    });
  }

  const notification = {
    id: `notif-${nextId++}`,
    depotId,
    type,
    message,
    metadata: metadata || {},
    isRead: false,
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  notifications.push(notification);
  console.log(`[Notification] Created: ${notification.id} for depot ${depotId}`);

  res.status(201).json({ success: true, notification });
});

/**
 * GET /notifications
 * Fetch notifications (optionally filtered by depotId)
 */
app.get('/notifications', (req, res) => {
  const { depotId, unreadOnly } = req.query;

  let result = [...notifications];

  if (depotId) {
    result = result.filter((n) => String(n.depotId) === String(depotId));
  }

  if (unreadOnly === 'true') {
    result = result.filter((n) => !n.isRead);
  }

  res.json({
    success: true,
    total: result.length,
    notifications: result,
  });
});

/**
 * PATCH /notifications/:id/read
 * Mark a notification as read
 */
app.patch('/notifications/:id/read', (req, res) => {
  const notification = notifications.find((n) => n.id === req.params.id);

  if (!notification) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  notification.isRead = true;
  notification.readAt = new Date().toISOString();

  res.json({ success: true, notification });
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
app.delete('/notifications/:id', (req, res) => {
  const index = notifications.findIndex((n) => n.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, error: 'Notification not found' });
  }

  notifications.splice(index, 1);
  res.json({ success: true, message: 'Notification deleted' });
});

/**
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'notification-app-be',
    totalNotifications: notifications.length,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`[Notification Service] Running at http://localhost:${PORT}`);
});

module.exports = app;
