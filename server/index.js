require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');
const { initDb } = require('./db');

const verifyFirebaseToken = require('./middleware/verifyFirebaseToken');

const roomsRouter = require('./routes/rooms');
const bookingsRouter = require('./routes/bookings');
const invoicesRouter = require('./routes/invoices');
const customersRouter = require('./routes/customers');
const migrateRouter = require('./routes/migrate');

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
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
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
app.use(cors());
app.use(bodyParser.json());

// Health
app.get('/_health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Public routes
app.use('/rooms', roomsRouter);
app.use('/migrate', migrateRouter);

// Temporarily make bookings, customers, and invoices public for development - TODO: Re-enable auth in production
app.use('/bookings', bookingsRouter);
app.use('/customers', customersRouter);
app.use('/invoices', invoicesRouter);

// Protected routes - require token verification (currently none)

const PORT = process.env.PORT || 4000;

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to initialize DB:', err);
  process.exit(1);
});
