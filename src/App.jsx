import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Import all pages
import Dashboard from './pages/Dashboard';
import CreateInvoice from './pages/CreateInvoice';
import Invoices from './pages/Invoices';
import Customers from './pages/Customers';
import Rooms from './pages/Rooms';
import AdminManagement from './pages/AdminManagement';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';

import './App.css';

// Main app content component
const AppContent = () => {
  const { isAuthenticated, loading, user, error } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Initializing Secure System...</p>
          <p style={{ fontSize: '0.9rem', color: '#666' }}>
            Loading authentication & security protocols
          </p>
        </div>
      </div>
    );
  }

  // Show error if authentication failed
  if (error) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f8fafc'
      }}>
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fff5f5',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          border: '1px solid #fed7d7',
          maxWidth: '400px'
        }}>
          <h2 style={{ color: '#e53e3e', marginBottom: '1rem' }}>Authentication Error</h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/create-invoice" 
            element={
              <ProtectedRoute permission="canCreateInvoices">
                <CreateInvoice />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/invoices" 
            element={
              <ProtectedRoute permission="canViewInvoices">
                <Invoices />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/customers" 
            element={
              <ProtectedRoute permission="canViewCustomers">
                <Customers />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/rooms" 
            element={
              <ProtectedRoute permission="canViewRooms">
                <Rooms />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute role="MasterAdmin">
                <AdminManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute role="MasterAdmin">
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/history" 
            element={
              <ProtectedRoute permission="canViewReports">
                <div style={{ padding: '2rem' }}>
                  <h1>Activity History</h1>
                  <p>Activity history and audit logs will be displayed here.</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute permission="canViewReports">
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute role="MasterAdmin">
                <div style={{ padding: '2rem' }}>
                  <h1>System Settings</h1>
                  <p>System configuration and settings will be displayed here.</p>
                </div>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <AppContent />
    </div>
  );
}

export default App;