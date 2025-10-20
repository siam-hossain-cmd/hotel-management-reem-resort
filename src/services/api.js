import authService from '../firebase/authService';

// Use Render backend URL
const API_BASE = import.meta.env.PROD 
  ? 'https://hotel-management-reem-resort-1.onrender.com/api'
  : '/api';

async function getAuthHeader() {
  try {
    const token = await authService.getIdToken();
    if (!token) return {};
    return { Authorization: `Bearer ${token}` };
  } catch (err) {
    console.warn('Failed to get auth token:', err);
  }
  return {};
}

export const api = {
  // Rooms
  getRooms: async () => {
    const res = await fetch(`${API_BASE}/rooms`);
    return res.json();
  },
  getAvailableRooms: async (checkinDate, checkoutDate) => {
    const res = await fetch(`${API_BASE}/rooms/available?checkin_date=${checkinDate}&checkout_date=${checkoutDate}`);
    return res.json();
  },
  getRoom: async (id) => {
    const res = await fetch(`${API_BASE}/rooms/${id}`);
    return res.json();
  },
  addRoom: async (roomData) => {
    const res = await fetch(`${API_BASE}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData)
    });
    return res.json();
  },
  updateRoomStatus: async (roomId, status) => {
    const response = await fetch(`${API_BASE}/rooms/${roomId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeader())
      },
      body: JSON.stringify({ status })
    });
    return response.json();
  },

  // Bookings (temporarily public)
  getBookings: async () => {
    const response = await fetch(`${API_BASE}/bookings`);
    return response.json();
  },
  getBookingById: async (id) => {
    const response = await fetch(`${API_BASE}/bookings/${id}`);
    return response.json();
  },
  createBooking: async (bookingData) => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    return res.json();
  },
  deleteBooking: async (id) => {
    const response = await fetch(`${API_BASE}/bookings/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeader())
      }
    });
    return response.json();
  },
  updateBookingStatus: async (id, statusPayload) => {
    const response = await fetch(`${API_BASE}/bookings/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeader())
      },
      body: JSON.stringify(statusPayload)
    });
    return response.json();
  },
  addBookingCharge: async (bookingId, chargeData) => {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/charges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeader())
      },
      body: JSON.stringify(chargeData)
    });
    return response.json();
  },
  getBookingCharges: async (bookingId) => {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/charges`);
    return response.json();
  },
  getBookingSummary: async (bookingId) => {
    const response = await fetch(`${API_BASE}/bookings/${bookingId}/summary`);
    return response.json();
  },
  addPayment: async (paymentData) => {
    const response = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeader())
      },
      body: JSON.stringify(paymentData)
    });
    return response.json();
  },
  getPaymentsByBookingId: async (bookingId) => {
    const response = await fetch(`${API_BASE}/payments/booking/${bookingId}`);
    return response.json();
  },

  // Customers (temporarily public)
  getCustomers: async () => {
    const response = await fetch(`${API_BASE}/customers`);
    return response.json();
  },
  createCustomer: async (customerData) => {
    const response = await fetch(`${API_BASE}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });
    return response.json();
  },

  // Invoices (temporarily public)
  getInvoices: async () => {
    const res = await fetch(`${API_BASE}/invoices`);
    return res.json();
  },
  createInvoice: async (invoiceData) => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });
    return res.json();
  },
  getInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`);
    return res.json();
  },
  getInvoiceById: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`);
    return res.json();
  },
  getInvoiceByBookingId: async (bookingId) => {
    const res = await fetch(`${API_BASE}/invoices/booking/${bookingId}`);
    return res.json();
  },
  deleteInvoice: async (id) => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeader())
      }
    });
    return res.json();
  }
};
