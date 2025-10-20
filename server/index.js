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
  origin: [
    'https://melodic-rugelach-3ae87b.netlify.app', // Netlify frontend
    process.env.FRONTEND_URL, // Additional frontend URL from environment variable
    'http://localhost:5173',  // Local development
    'http://localhost:4173'   // Local preview
  ].filter(Boolean), // Remove undefined values
  credentials: true,
  optionsSuccessStatus: 200
} : {
  origin: true, // Allow all origins in development
  credentials: true
};

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

// Serve static files in production (only if dist folder exists - for monorepo deployments)
if (isProduction) {
  const frontendBuildPath = path.join(__dirname, '..', 'dist');
  // Check if dist folder exists before serving
  import('fs').then(fs => {
    if (fs.existsSync(frontendBuildPath)) {
      console.log(`🌐 Serving frontend from: ${frontendBuildPath}`);
      app.use(express.static(frontendBuildPath));
      
      // Handle React Router - send all non-API requests to index.html
      app.get('*', (req, res) => {
        res.sendFile(path.join(frontendBuildPath, 'index.html'));
      });
    } else {
      console.log('📡 Running as API-only server (frontend hosted separately)');
      // Catch-all for undefined routes
      app.use('*', (req, res) => {
        res.status(404).json({ 
          error: 'Not Found',
          message: 'API endpoint not found. Frontend is hosted separately.'
        });
      });
    }
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
