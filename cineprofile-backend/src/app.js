const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// ROUTES
const analyzeRouter = require('./routes/analyzeTest'); // <-- router dosyan
app.use('/api', analyzeRouter); // <-- /api/* altına mount

// health
app.get('/health', (req, res) => res.json({ ok: true }));

// (debug) yüklü route'ları bir kere logla
process.nextTick(() => {
  try {
    const stack = app._router?.stack || [];
    const lines = [];
    for (const layer of stack) {
      if (layer.route?.path) {
        const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]).map(m => m.toUpperCase());
        lines.push(`${methods.join(',')} ${layer.route.path}`);
      } else if (layer.name === 'router' && layer.handle?.stack) {
        for (const r of layer.handle.stack) {
          if (r.route?.path) {
            const methods = Object.keys(r.route.methods).filter(m => r.route.methods[m]).map(m => m.toUpperCase());
            lines.push(`${methods.join(',')} /api${r.route.path}`);
          }
        }
      }
    }
    console.log('Mounted routes:\n' + (lines.join('\n') || '(none)'));
  } catch (e) {
    console.log('Route list error:', e.message);
  }
});

module.exports = app;
