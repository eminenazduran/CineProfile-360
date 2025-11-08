// src/app.js
const express = require('express');
const cors = require('cors');
const logger = require('./logger');

const app = express();
app.use(cors());
app.use(express.json());

// basit istek loglama
app.use((req, res, next) => {
  logger.info({ path: req.path, method: req.method });
  next();
});

// health
app.get('/health', (req, res) => res.json({ ok: true }));

// analyze-test route
const analyzeTest = require('./routes/analyzeTest');
app.use('/api', analyzeTest);

module.exports = app;
