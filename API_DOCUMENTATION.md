# REEM Resort Backend API Documentation

Base URL: `http://localhost:8000`

## API Endpoints Overview

### 🏥 Health Check
- **GET** `/_health` - Check if server is running

### 🏠 Rooms (Public)
- **GET** `/rooms` - Get all rooms
- **GET** `/rooms/:id` - Get specific room by ID

### 🏨 Bookings (Protected - requires Firebase Auth)
- **POST** `/bookings` - Create new booking with availability check

### 🧾 Invoices (Protected - requires Firebase Auth)  
- **POST** `/invoices` - Create new invoice
- **GET** `/invoices/:id` - Get specific invoice

---

## Detailed API Reference

### 1. Health Check

```bash
GET /_health
```

**Response:**
```json
{
  "ok": true,
  "ts": 1760275903855
}
```

### 2. Get All Rooms

```bash
GET /rooms
```

**Response:**
```json
{
  "success": true,
  "rooms": [
    {
      "id": 1,
      "room_number": "101",
      "room_type": "Standard",
      "capacity": 2,
      "rate": "100.00",
      "status": "available",
      "meta": "{\"floor\": 1}",
      "created_at": "2025-10-12T01:09:07.000Z"
    }
  ]
}
```

### 3. Get Single Room

```bash
GET /rooms/:id
```

**Example:** `GET /rooms/1`

**Response:**
```json
{
  "success": true,
  "room": {
    "id": 1,
    "room_number": "101",
    "room_type": "Standard",
    "capacity": 2,
    "rate": "100.00",
    "status": "available",
    "meta": "{\"floor\": 1}",
    "created_at": "2025-10-12T01:09:07.000Z"
  }
}
```

### 4. Create Booking (Protected)

```bash
POST /bookings
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "customer_id": 1,
  "room_id": 1,
  "checkin_date": "2025-10-15",
  "checkout_date": "2025-10-17",
  "total_amount": 200.00,
  "currency": "USD"
}
```

**Success Response:**
```json
{
  "success": true,
  "booking_id": 123,
  "invoice_id": 456
}
```

**Error Response (Room Not Available):**
```json
{
  "success": false,
  "error": "Room not available for selected dates",
  "conflicts": [...]
}
```

### 5. Create Invoice (Protected)

```bash
POST /invoices
Authorization: Bearer <firebase-id-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "booking_id": 123,
  "customer_id": 1,
  "total": 200.00,
  "currency": "USD",
  "status": "issued"
}
```

**Response:**
```json
{
  "success": true,
  "invoice_id": 456
}
```

### 6. Get Invoice (Protected)

```bash
GET /invoices/:id
Authorization: Bearer <firebase-id-token>
```

**Response:**
```json
{
  "success": true,
  "invoice": {
    "id": 456,
    "booking_id": 123,
    "customer_id": 1,
    "total": "200.00",
    "currency": "USD",
    "status": "issued",
    "created_at": "2025-10-12T01:09:07.000Z"
  }
}
```

---

## Authentication

### Protected Endpoints
Bookings and Invoices endpoints require Firebase Authentication:

1. User must be logged in via Firebase Auth in frontend
2. Frontend calls `authService.getIdToken()` to get JWT token
3. Include in request header: `Authorization: Bearer <token>`

### Public Endpoints
- Health check (`/_health`)
- Rooms (`/rooms`, `/rooms/:id`)

---

## Database Schema

### Tables Created in Your cPanel Database:

1. **customers** - Store customer information
2. **rooms** - Room details and availability
3. **bookings** - Reservation management with date conflicts checking
4. **invoices** - Billing and invoice generation
5. **invoice_items** - Itemized billing details
6. **payments** - Payment tracking and status

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid/missing auth token)
- `404` - Not Found
- `409` - Conflict (e.g., room not available)
- `500` - Internal Server Error

---

## Frontend Integration

Your React frontend uses `src/services/api.js` to call these endpoints:

```javascript
import { api } from '../services/api';

// Get rooms (public)
const rooms = await api.getRooms();

// Create booking (requires auth)
const booking = await api.createBooking({
  customer_id: 1,
  room_id: 1,
  checkin_date: "2025-10-15",
  checkout_date: "2025-10-17",
  total_amount: 200.00
});
```