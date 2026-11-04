const net = require('net');
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(false);
}

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const { jsonSyntaxErrorHandler, globalErrorHandler } = require('./src/middlewares/errorHandler');
const apiRoutes = require('./src/routes');
const db = require('./src/models');
const syncAll = require('./src/scripts/syncAll');

const app = express();
const PORT = process.env.PORT || 3000;

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(jsonSyntaxErrorHandler);

// Serve Static Assets
app.use('/images', express.static(path.join(__dirname, 'public', 'images')));
app.use('/css', express.static(path.join(__dirname, 'public', 'css')));
app.use('/js', express.static(path.join(__dirname, 'public', 'js')));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Master API Routes
app.use('/api', apiRoutes);

// Serve React Vite Build / SPA
const clientDist = path.join(__dirname, 'client', 'dist');

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Fallback for unmatched API routes
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint API "${req.originalUrl}" tidak ditemukan.` });
});

// Centralized Error Handler
app.use(globalErrorHandler);

// Process-level unhandled exception and rejection guards
process.on('uncaughtException', (err) => {
  console.error('[Process Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('[Process Unhandled Rejection]', reason);
});

// Start Express Server with automatic port fallback
async function bootDatabase() {
  try {
    await db.sequelize.authenticate();
    console.log('✅ [Sequelize] Terhubung ke PostgreSQL Database.');
  } catch (err) {
    console.warn('⚠️ [Sequelize Warning] Database belum terhubung:', err.message);
  }
}

function startServer(portToTry) {
  const server = app.listen(portToTry, async () => {
    console.log(`\n======================================================`);
    console.log(`🚀 NGALAM FIX PRO - Express, Sequelize & React Vite!`);
    console.log(`📡 URL Website: http://localhost:${portToTry}`);
    console.log(`======================================================\n`);

    await bootDatabase();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      const nextPort = Number(portToTry) + 1;
      console.warn(`[Server] Port ${portToTry} sedang digunakan. Mencoba port alternatif ${nextPort}...`);
      startServer(nextPort);
    } else {
      console.error('[Server Error]', err);
    }
  });
}

if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  startServer(PORT);
}

module.exports = app;
