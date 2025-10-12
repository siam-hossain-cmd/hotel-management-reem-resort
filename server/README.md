# REEM Resort - Backend (Minimal Scaffold)

This folder contains a minimal Express backend that verifies Firebase ID tokens and stores rooms, bookings, and invoices in MySQL.

Files:
- `index.js` - Server entry point. Initializes Firebase Admin and DB pool.
- `db.js` - MySQL connection pool helper.
- `middleware/verifyFirebaseToken.js` - Express middleware to verify Firebase ID tokens.
- `routes/rooms.js` - Public routes for rooms (read-only).
- `routes/bookings.js` - Protected bookings endpoints (requires Authorization header).
- `routes/invoices.js` - Protected invoices endpoints (requires Authorization header).
- `migrations/init.sql` - Initial SQL schema for MySQL.

Quick setup:
1. Copy `.env.example` to `.env` and fill values for MySQL and Firebase service account.
2. Install dependencies:

```bash
cd server
npm install
```

3. Create the database and run migrations (example using mysql client):

```bash
mysql -u root -p
CREATE DATABASE reem_resort CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT
mysql -u root -p reem_resort < migrations/init.sql
```

Or run the bundled migration script (requires `.env` to be configured):

```bash
npm run migrate
```

4. Start server:

```bash
npm run dev
```

Notes:
- The server expects a Firebase service account JSON string in `FIREBASE_SERVICE_ACCOUNT_JSON` or a path via `FIREBASE_SERVICE_ACCOUNT_PATH`.
- The server exposes endpoints at `http://localhost:4000` by default. Set `VITE_API_BASE` in the frontend environment to point to this server.

This scaffold is intentionally minimal. For production, add:
- Input validation and sanitization (e.g., celebrate/Joi)
- Rate limiting and security headers
- Proper logging and monitoring
- Tests and CI
- Deployment configuration

Docker (optional)
---------------

You can run a local MySQL instance and run migrations with Docker Compose. From the `server/` folder run:

```bash
# Start MySQL and Adminer
docker compose up -d db adminer

# Run the migration container which will execute the SQL migrations
docker compose run --rm migrator
```

Adminer will be available at http://localhost:8080 so you can inspect the database.

If you prefer not to use Docker, follow the manual steps above to install MySQL locally and run the SQL files.
