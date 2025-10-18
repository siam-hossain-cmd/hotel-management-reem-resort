import React, { useState, useEffect } from 'react';
import { BarChart3, Users, FileText, TrendingUp, DollarSign, Calendar, CreditCard, CheckCircle, Clock, AlertTriangle, Home, Briefcase, Filter, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import '../reports.css';

const Reports = () => {
  const { isAnyAdmin } = useAuth();
  const [activeReport, setActiveReport] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'monthly', 'yearly'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportData, setReportData] = useState({
    bookings: [],
    payments: [],
    rooms: []
  });
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    totalPaid: 0,
    totalDue: 0,
    confirmedBookings: 0,
    checkedInBookings: 0,
    checkedOutBookings: 0,
    cancelledBookings: 0,
    occupancyRate: 0,
    averageBookingValue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalPayments: 0
  });

  useEffect(() => {
    loadReportData();
  }, [timeRange, selectedMonth, selectedYear]);

  const filterDataByTimeRange = (data, dateField) => {
    if (timeRange === 'all') return data;
    
    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      if (timeRange === 'monthly') {
        return itemDate.getMonth() === selectedMonth && 
               itemDate.getFullYear() === selectedYear;
      } else if (timeRange === 'yearly') {
        return itemDate.getFullYear() === selectedYear;
      }
      return true;
    });
  };

  const loadReportData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel from MySQL backend
      const [bookingsResult, roomsResult] = await Promise.all([
        api.getBookings(),
        api.getRooms()
      ]);

      const allBookings = bookingsResult.success ? bookingsResult.bookings : [];
      const allRooms = roomsResult.success ? roomsResult.rooms : [];

      // Filter bookings based on time range
      const filteredBookings = filterDataByTimeRange(allBookings, 'created_at');

      // Extract payments from bookings
      const allPayments = [];
      for (const booking of filteredBookings) {
        try {
          const summaryResult = await api.getBookingSummary(booking.id);
          if (summaryResult.success && summaryResult.summary.payments) {
            allPayments.push(...summaryResult.summary.payments.map(p => ({
              ...p,
              booking_id: booking.id,
              booking_reference: booking.booking_reference
            })));
          }
        } catch (err) {
          console.error('Error fetching payments for booking:', booking.id, err);
        }
      }

      // Filter payments by time range
      const filteredPayments = filterDataByTimeRange(allPayments, 'created_at');

      // Calculate statistics
      const totalBookings = filteredBookings.length;
      const totalRevenue = filteredBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
      const totalPaid = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
      const totalDue = totalRevenue - totalPaid;

      const confirmedBookings = filteredBookings.filter(b => 
        b.status === 'confirmed'
      ).length;
      
      const checkedInBookings = filteredBookings.filter(b => 
        b.status === 'checked-in' || b.status === 'checked_in'
      ).length;
      
      const checkedOutBookings = filteredBookings.filter(b => 
        b.status === 'checked-out' || b.status === 'checked_out'
      ).length;
      
      const cancelledBookings = filteredBookings.filter(b => 
        b.status === 'cancelled'
      ).length;

      const averageBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

      // Calculate occupancy rate
      const totalRooms = allRooms.length;
      const occupiedRooms = allRooms.filter(r => r.status === 'occupied').length;
      const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;

      // Count invoices (bookings with invoices)
      const bookingsWithInvoices = filteredBookings.filter(b => b.total_amount > 0);
      const totalInvoices = bookingsWithInvoices.length;
      const paidInvoices = bookingsWithInvoices.filter(b => 
        parseFloat(b.paid_amount || 0) >= parseFloat(b.total_amount || 0)
      ).length;
      const unpaidInvoices = totalInvoices - paidInvoices;

      setReportData({
        bookings: filteredBookings,
        payments: filteredPayments,
        rooms: allRooms
      });

      setStats({
        totalBookings,
        totalRevenue,
        totalPaid,
        totalDue,
        confirmedBookings,
        checkedInBookings,
        checkedOutBookings,
        cancelledBookings,
        occupancyRate,
        averageBookingValue,
        totalInvoices,
        paidInvoices,
        unpaidInvoices,
        totalPayments: filteredPayments.length
      });
    } catch (error) {
      console.error('Error loading report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `৳${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getMonthName = (monthIndex) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthIndex];
  };

  const getTimeRangeLabel = () => {
    if (timeRange === 'all') return 'All Time';
    if (timeRange === 'monthly') return `${getMonthName(selectedMonth)} ${selectedYear}`;
    if (timeRange === 'yearly') return `Year ${selectedYear}`;
    return 'All Time';
  };

  const renderTimeFilter = () => {
    return (
      <div className="time-filter-section">
        <div className="filter-header">
          <Filter size={20} />
          <h3>Time Range Filter</h3>
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <label>Period:</label>
            <select 
              value={timeRange} 
              onChange={(e) => setTimeRange(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Time</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          {timeRange === 'monthly' && (
            <div className="filter-group">
              <label>Month:</label>
              <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="filter-select"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i}>{getMonthName(i)}</option>
                ))}
              </select>
            </div>
          )}

          {(timeRange === 'monthly' || timeRange === 'yearly') && (
            <div className="filter-group">
              <label>Year:</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="filter-select"
              >
                {Array.from({ length: 5 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
          )}
        </div>

        <div className="selected-range">
          <span className="range-badge">{getTimeRangeLabel()}</span>
        </div>
      </div>
    );
  };

  if (!isAnyAdmin()) {
    return (
      <div className="access-denied">
        <h2>Access Denied</h2>
        <p>You don't have permission to view reports.</p>
      </div>
    );
  }

  const reportTabs = [
    { id: 'overview', name: 'System Overview', icon: BarChart3 },
    { id: 'bookings', name: 'Booking Reports', icon: Calendar },
    { id: 'payments', name: 'Payment Reports', icon: CreditCard },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp }
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading reports...</p>
        </div>
      );
    }

    switch (activeReport) {
      case 'overview':
        return (
          <div className="reports-overview">
            <div className="report-header-section">
              <h2>System Overview</h2>
              {renderTimeFilter()}
            </div>
            
            {/* Revenue Stats */}
            <div className="stats-grid">
              <div className="stat-card revenue">
                <div className="stat-icon">
                  <DollarSign size={32} />
                </div>
                <div className="stat-content">
                  <h3>Total Revenue</h3>
                  <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                  <span className="stat-label">{getTimeRangeLabel()}</span>
                </div>
              </div>

              <div className="stat-card paid">
                <div className="stat-icon">
                  <CheckCircle size={32} />
                </div>
                <div className="stat-content">
                  <h3>Total Paid</h3>
                  <p className="stat-value">{formatCurrency(stats.totalPaid)}</p>
                  <span className="stat-label">Collected payments</span>
                </div>
              </div>

              <div className="stat-card due">
                <div className="stat-icon">
                  <AlertTriangle size={32} />
                </div>
                <div className="stat-content">
                  <h3>Total Due</h3>
                  <p className="stat-value">{formatCurrency(stats.totalDue)}</p>
                  <span className="stat-label">Outstanding balance</span>
                </div>
              </div>

              <div className="stat-card average">
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <h3>Average Booking</h3>
                  <p className="stat-value">{formatCurrency(stats.averageBookingValue)}</p>
                  <span className="stat-label">Per booking revenue</span>
                </div>
              </div>
            </div>

            {/* Booking Stats */}
            <div className="stats-section">
              <h3>Booking Statistics</h3>
              <div className="stats-grid-small">
                <div className="stat-card-small total">
                  <Calendar size={24} />
                  <div>
                    <p className="stat-number">{stats.totalBookings}</p>
                    <p className="stat-label">Total Bookings</p>
                  </div>
                </div>

                <div className="stat-card-small confirmed">
                  <Clock size={24} />
                  <div>
                    <p className="stat-number">{stats.confirmedBookings}</p>
                    <p className="stat-label">Confirmed</p>
                  </div>
                </div>

                <div className="stat-card-small checked-in">
                  <Home size={24} />
                  <div>
                    <p className="stat-number">{stats.checkedInBookings}</p>
                    <p className="stat-label">Checked In</p>
                  </div>
                </div>

                <div className="stat-card-small checked-out">
                  <Briefcase size={24} />
                  <div>
                    <p className="stat-number">{stats.checkedOutBookings}</p>
                    <p className="stat-label">Checked Out</p>
                  </div>
                </div>

                <div className="stat-card-small cancelled">
                  <AlertTriangle size={24} />
                  <div>
                    <p className="stat-number">{stats.cancelledBookings}</p>
                    <p className="stat-label">Cancelled</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Bookings */}
            <div className="recent-section">
              <h3>Recent Bookings</h3>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.bookings.slice(0, 10).map((booking) => (
                      <tr key={booking.id}>
                        <td>{booking.booking_reference}</td>
                        <td>{booking.first_name} {booking.last_name}</td>
                        <td>{booking.room_number}</td>
                        <td>{formatDate(booking.checkin_date)}</td>
                        <td>{formatDate(booking.checkout_date)}</td>
                        <td>{formatCurrency(booking.total_amount)}</td>
                        <td>
                          <span className={`status-badge status-${booking.status}`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.bookings.length === 0 && (
                  <div className="empty-state-small">
                    <p>No bookings found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'bookings':
        return (
          <div className="booking-reports">
            <div className="report-header-section">
              <h2>Booking Reports</h2>
              {renderTimeFilter()}
            </div>
            
            <div className="stats-grid">
              <div className="stat-card total">
                <div className="stat-icon">
                  <Calendar size={32} />
                </div>
                <div className="stat-content">
                  <h3>Total Bookings</h3>
                  <p className="stat-value">{stats.totalBookings}</p>
                  <span className="stat-label">{getTimeRangeLabel()}</span>
                </div>
              </div>

              <div className="stat-card confirmed">
                <div className="stat-icon">
                  <Clock size={32} />
                </div>
                <div className="stat-content">
                  <h3>Confirmed</h3>
                  <p className="stat-value">{stats.confirmedBookings}</p>
                  <span className="stat-label">Awaiting check-in</span>
                </div>
              </div>

              <div className="stat-card checked-in">
                <div className="stat-icon">
                  <Home size={32} />
                </div>
                <div className="stat-content">
                  <h3>Checked In</h3>
                  <p className="stat-value">{stats.checkedInBookings}</p>
                  <span className="stat-label">Currently staying</span>
                </div>
              </div>

              <div className="stat-card checked-out">
                <div className="stat-icon">
                  <Briefcase size={32} />
                </div>
                <div className="stat-content">
                  <h3>Checked Out</h3>
                  <p className="stat-value">{stats.checkedOutBookings}</p>
                  <span className="stat-label">Completed stays</span>
                </div>
              </div>
            </div>

            <div className="recent-section">
              <h3>Booking Details ({reportData.bookings.length} total)</h3>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Booking Ref</th>
                      <th>Guest</th>
                      <th>Room</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Amount</th>
                      <th>Paid</th>
                      <th>Due</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.bookings.map((booking) => {
                      const total = parseFloat(booking.total_amount || 0);
                      const paid = parseFloat(booking.paid_amount || 0);
                      const due = total - paid;
                      
                      return (
                        <tr key={booking.id}>
                          <td>{booking.booking_reference}</td>
                          <td>{booking.first_name} {booking.last_name}</td>
                          <td>{booking.room_number}</td>
                          <td>{formatDate(booking.checkin_date)}</td>
                          <td>{formatDate(booking.checkout_date)}</td>
                          <td>{formatCurrency(total)}</td>
                          <td className="text-success">{formatCurrency(paid)}</td>
                          <td className={due > 0 ? 'text-danger' : 'text-success'}>{formatCurrency(due)}</td>
                          <td>
                            <span className={`status-badge status-${booking.status}`}>
                              {booking.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {reportData.bookings.length === 0 && (
                  <div className="empty-state-small">
                    <Calendar size={48} />
                    <p>No bookings found for {getTimeRangeLabel()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="payment-reports">
            <div className="report-header-section">
              <h2>Payment Reports</h2>
              {renderTimeFilter()}
            </div>
            
            <div className="stats-grid">
              <div className="stat-card total-payments">
                <div className="stat-icon">
                  <CreditCard size={32} />
                </div>
                <div className="stat-content">
                  <h3>Total Payments</h3>
                  <p className="stat-value">{stats.totalPayments}</p>
                  <span className="stat-label">{getTimeRangeLabel()}</span>
                </div>
              </div>

              <div className="stat-card paid">
                <div className="stat-icon">
                  <DollarSign size={32} />
                </div>
                <div className="stat-content">
                  <h3>Amount Collected</h3>
                  <p className="stat-value">{formatCurrency(stats.totalPaid)}</p>
                  <span className="stat-label">Total received</span>
                </div>
              </div>

              <div className="stat-card due">
                <div className="stat-icon">
                  <AlertTriangle size={32} />
                </div>
                <div className="stat-content">
                  <h3>Outstanding</h3>
                  <p className="stat-value">{formatCurrency(stats.totalDue)}</p>
                  <span className="stat-label">Pending collection</span>
                </div>
              </div>

              <div className="stat-card collection-rate">
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <h3>Collection Rate</h3>
                  <p className="stat-value">
                    {stats.totalRevenue > 0 
                      ? ((stats.totalPaid / stats.totalRevenue) * 100).toFixed(1) + '%'
                      : '0%'}
                  </p>
                  <span className="stat-label">Payment efficiency</span>
                </div>
              </div>
            </div>

            <div className="recent-section">
              <h3>Payment Transactions ({reportData.payments.length} total)</h3>
              <div className="table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Booking Ref</th>
                      <th>Payment Method</th>
                      <th>Amount</th>
                      <th>Reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.payments.map((payment, index) => (
                      <tr key={payment.id || index}>
                        <td>{formatDate(payment.created_at || payment.processedAt)}</td>
                        <td>{payment.booking_reference || 'N/A'}</td>
                        <td>
                          <span className="payment-method-badge">
                            {(payment.method || payment.gateway || 'Cash').toUpperCase()}
                          </span>
                        </td>
                        <td className="text-success">{formatCurrency(payment.amount)}</td>
                        <td>{payment.reference || '-'}</td>
                        <td>
                          <span className="status-badge status-paid">
                            {payment.status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {reportData.payments.length === 0 && (
                  <div className="empty-state-small">
                    <CreditCard size={48} />
                    <p>No payments found for {getTimeRangeLabel()}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="analytics-reports">
            <div className="report-header-section">
              <h2>Analytics & Insights</h2>
              {renderTimeFilter()}
            </div>
            
            <div className="stats-grid">
              <div className="stat-card revenue">
                <div className="stat-icon">
                  <DollarSign size={32} />
                </div>
                <div className="stat-content">
                  <h3>Revenue Overview</h3>
                  <p className="stat-value">{formatCurrency(stats.totalRevenue)}</p>
                  <span className="stat-label">{getTimeRangeLabel()}</span>
                </div>
              </div>

              <div className="stat-card conversion">
                <div className="stat-icon">
                  <TrendingUp size={32} />
                </div>
                <div className="stat-content">
                  <h3>Collection Rate</h3>
                  <p className="stat-value">
                    {stats.totalRevenue > 0 
                      ? ((stats.totalPaid / stats.totalRevenue) * 100).toFixed(1) + '%'
                      : '0%'}
                  </p>
                  <span className="stat-label">Payment collection rate</span>
                </div>
              </div>

              <div className="stat-card bookings">
                <div className="stat-icon">
                  <Calendar size={32} />
                </div>
                <div className="stat-content">
                  <h3>Active Bookings</h3>
                  <p className="stat-value">
                    {stats.confirmedBookings + stats.checkedInBookings}
                  </p>
                  <span className="stat-label">Confirmed + Checked-in</span>
                </div>
              </div>

              <div className="stat-card occupancy">
                <div className="stat-icon">
                  <Home size={32} />
                </div>
                <div className="stat-content">
                  <h3>Occupancy Rate</h3>
                  <p className="stat-value">{stats.occupancyRate.toFixed(1)}%</p>
                  <span className="stat-label">Current hotel occupancy</span>
                </div>
              </div>
            </div>

            <div className="analytics-section">
              <h3>Performance Metrics</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <h4>Booking Completion Rate</h4>
                  <div className="metric-value">
                    {stats.totalBookings > 0
                      ? (((stats.totalBookings - stats.cancelledBookings) / stats.totalBookings) * 100).toFixed(1) + '%'
                      : '0%'}
                  </div>
                  <p className="metric-desc">Non-cancelled bookings</p>
                  <div className="metric-detail">
                    {stats.totalBookings - stats.cancelledBookings} of {stats.totalBookings} bookings
                  </div>
                </div>

                <div className="metric-card">
                  <h4>Average Booking Value</h4>
                  <div className="metric-value">{formatCurrency(stats.averageBookingValue)}</div>
                  <p className="metric-desc">Per booking revenue</p>
                  <div className="metric-detail">
                    Based on {stats.totalBookings} bookings
                  </div>
                </div>

                <div className="metric-card">
                  <h4>Payment Fulfillment</h4>
                  <div className="metric-value">
                    {stats.totalInvoices > 0
                      ? ((stats.paidInvoices / stats.totalInvoices) * 100).toFixed(0) + '%'
                      : '0%'}
                  </div>
                  <p className="metric-desc">Fully paid bookings</p>
                  <div className="metric-detail">
                    {stats.paidInvoices} of {stats.totalInvoices} paid
                  </div>
                </div>

                <div className="metric-card">
                  <h4>Cancellation Rate</h4>
                  <div className="metric-value">
                    {stats.totalBookings > 0
                      ? ((stats.cancelledBookings / stats.totalBookings) * 100).toFixed(1) + '%'
                      : '0%'}
                  </div>
                  <p className="metric-desc">Cancelled bookings</p>
                  <div className="metric-detail">
                    {stats.cancelledBookings} cancellations
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Breakdown - Only show for yearly or all time */}
            {(timeRange === 'yearly' || timeRange === 'all') && (
              <div className="monthly-breakdown-section">
                <h3>Monthly Revenue Breakdown</h3>
                <div className="monthly-chart-placeholder">
                  <p>Monthly revenue chart will be displayed here</p>
                  <p className="text-muted">Chart visualization coming soon</p>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="empty-state">
            <BarChart3 size={64} />
            <h3>Select a Report</h3>
            <p>Choose a report type from the tabs above.</p>
          </div>
        );
    }
  };

  return (
    <div className="reports">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <p>View system reports and analytics data</p>
      </div>

      <div className="reports-container">
        <div className="reports-sidebar">
          <div className="report-tabs">
            {reportTabs.map(tab => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  className={'report-tab' + (activeReport === tab.id ? ' active' : '')}
                  onClick={() => setActiveReport(tab.id)}
                >
                  <IconComponent size={20} />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="reports-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default Reports;
