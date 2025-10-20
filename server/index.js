import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import admin from 'firebase-admin';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb } from './db.js';

import verifyFirebaseToken from './middleware/verifyFirebaseToken.js';

import roomsRouter from './routes/rooms.js';
import bookingsRouter from './routes/bookings.js';
import invoicesRouter from './routes/invoices.js';
import customersRouter from './routes/customers.js';
import migrateRouter from './routes/migrate.js';
import paymentsRouter from './routes/payments.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';

// Initialize Firebase Admin
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Firebase Admin initialized from JSON env');
  } catch (err) {
    console.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON:', err.message);
    process.exit(1);
  }
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
  try {
    // For ES modules, we need to use dynamic import for JSON files
    const { default: serviceAccount } = await import(process.env.FIREBASE_SERVICE_ACCOUNT_PATH, { assert: { type: 'json' } });
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    console.log('Firebase Admin initialized from path');
  } catch (err) {
    console.error('Failed to load service account from path:', err.message);
    process.exit(1);
  }
} else {
  console.warn('No Firebase service account provided. Auth verification will fail until configured.');
}

const app = express();

// CORS configuration - restrict in production
const corsOptions = isProduction ? {
  origin: process.env.FRONTEND_URL || 'https://your-domain.com',
  credentials: true,
  optionsSuccessStatus: 200
} : {};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// Request logging in development
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// Health
app.get('/_health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Public routes
app.use('/api/rooms', roomsRouter);
app.use('/api/migrate', migrateRouter);

// Temporarily make bookings, customers, and invoices public for development - TODO: Re-enable auth in production
app.use('/api/bookings', bookingsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/payments', paymentsRouter);

// Protected routes - require token verification (currently none)

// Serve static files in production
if (isProduction) {
  const frontendBuildPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(frontendBuildPath));
  
  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: isProduction ? 'Something went wrong' : err.message 
  });
});

const PORT = process.env.PORT || 4000;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} mode`);
    console.log(`📡 Server listening on port ${PORT}`);
    if (isProduction) {
      console.log(`🌐 Serving frontend from: ${path.join(__dirname, '..', 'dist')}`);
    }
  });
}).catch(err => {
  console.error('❌ Failed to initialize DB:', err);
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  console.log('\n🔄 Received shutdown signal, closing server gracefully...');
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
