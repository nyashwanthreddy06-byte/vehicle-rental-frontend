/**
 * dashboard.js — Dashboard page logic
 * Loads summary stats and recent vehicle list from the backend
 */

async function loadDashboard() {
  setStats({ vehicles: '…', available: '…', rented: '…', customers: '…', bookings: '…', revenue: '…' });

  try {
    const [vehicles, customers, bookings] = await Promise.all([
      apiGet('/vehicles'),
      apiGet('/customers'),
      apiGet('/bookings'),
    ]);

    const available = vehicles.filter(v => v.status === 'AVAILABLE').length;
    const rented    = vehicles.filter(v => v.status === 'RENTED').length;
    const revenue   = bookings
      .filter(b => b.status !== 'CANCELLED')
      .reduce((sum, b) => sum + (b.totalCostInr || 0), 0);

    setStats({
      vehicles  : vehicles.length,
      available : available,
      rented    : rented,
      customers : customers.length,
      bookings  : bookings.length,
      revenue   : Number(revenue).toLocaleString('en-IN', { maximumFractionDigits: 0 }),
    });

    renderRecentVehicles(vehicles.slice(-8).reverse());
    renderRecentBookings(bookings.slice(-5).reverse());

  } catch (e) {
    showToast('❌ Cannot reach backend — is the server running on port 8080?', 'error');
  }
}

function setStats(s) {
  document.getElementById('stat-vehicles').textContent  = s.vehicles;
  document.getElementById('stat-available').textContent = s.available;
  document.getElementById('stat-rented').textContent    = s.rented;
  document.getElementById('stat-customers').textContent = s.customers;
  document.getElementById('stat-bookings').textContent  = s.bookings;
  const rev = document.getElementById('stat-revenue');
  if (rev) rev.textContent = typeof s.revenue === 'string' ? s.revenue : s.revenue;
}

function renderRecentVehicles(vehicles) {
  const tbody = document.getElementById('dash-vehicles');
  if (!vehicles.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="state-msg"><span class="icon">🚘</span>No vehicles added yet</td></tr>`;
    return;
  }
  tbody.innerHTML = vehicles.map(v => `
    <tr>
      <td><strong>${v.vehicleName}</strong></td>
      <td>${v.vehicleType}</td>
      <td>${v.model}</td>
      <td><code>${v.numberPlate}</code></td>
      <td class="price">${Number(v.pricePerDay).toLocaleString('en-IN')}</td>
      <td>${statusBadge(v.status)}</td>
    </tr>
  `).join('');
}

function renderRecentBookings(bookings) {
  const tbody = document.getElementById('dash-bookings');
  if (!bookings.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="state-msg"><span class="icon">📋</span>No bookings yet</td></tr>`;
    return;
  }
  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td>${b.customer?.name || '—'}</td>
      <td>${b.vehicle?.vehicleName || '—'}</td>
      <td>${b.rentalDays ?? '—'} day(s)</td>
      <td class="price">${b.totalCostInr != null ? Number(b.totalCostInr).toLocaleString('en-IN') : '—'}</td>
      <td>${statusBadge(b.status)}</td>
    </tr>
  `).join('');
}

document.addEventListener('DOMContentLoaded', loadDashboard);
