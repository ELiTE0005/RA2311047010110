// Logging Middleware - Placeholder
// This folder contains the logging middleware implementation
// See the main middleware file for implementation details

const express = require('express');
const app = express();

// Basic logging middleware
const loggingMiddleware = (req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
  next();
};

app.use(loggingMiddleware);

module.exports = loggingMiddleware;
