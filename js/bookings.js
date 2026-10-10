/**
 * bookings.js — Bookings page logic
 * Manages vehicle reservations, live calculation in INR (₹), complete & cancel
 */

let allBookings = [];
let availableVehicles = [];
let allCustomers = [];

async function loadBookingsPage() {
  const tbody = document.getElementById('bookings-tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="state-msg"><div class="loading-spinner"></div></td></tr>`;

  try {
    const [bookings, customers, available] = await Promise.all([
      apiGet('/bookings'),
      apiGet('/customers'),
      apiGet('/vehicles/available')
    ]);

    allBookings = bookings;
    allCustomers = customers;
    availableVehicles = available;

    populateDropdowns();
    renderBookings(allBookings);
  } catch (e) {
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" class="state-msg"><span class="icon">❌</span>${e.message}</td></tr>`;
    showToast('❌ Failed to load booking data', 'error');
  }
}

function populateDropdowns() {
  const cSel = document.getElementById('b-customer');
  const vSel = document.getElementById('b-vehicle');

  if (cSel) {
    cSel.innerHTML = '<option value="">— Select Customer —</option>' +
      allCustomers.map(c => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join('');
  }

  if (vSel) {
    vSel.innerHTML = '<option value="">— Select Vehicle —</option>' +
      availableVehicles.map(v => `<option value="${v.id}" data-price="${v.pricePerDay}">${v.vehicleName} (${v.vehicleType}) — ${formatINR(v.pricePerDay)}/day</option>`).join('');
  }
}

function updatePricePreview() {
  const vSel = document.getElementById('b-vehicle');
  const startVal = document.getElementById('b-start').value;
  const endVal = document.getElementById('b-end').value;
  const preview = document.getElementById('price-preview');

  if (!vSel || !preview) return;

  const opt = vSel.options[vSel.selectedIndex];
  const price = opt ? parseFloat(opt.dataset.price) : 0;

  if (!price || !startVal || !endVal) {
    preview.style.display = 'none';
    return;
  }

  const startDate = new Date(startVal);
  const endDate = new Date(endVal);
  const diffDays = Math.round((endDate - startDate) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    preview.style.display = 'none';
    return;
  }

  const total = diffDays * price;
  document.getElementById('preview-days').textContent = `${diffDays} day(s) × ${formatINR(price)}/day`;
  document.getElementById('preview-total').textContent = `= ${formatINR(total)}`;
  preview.style.display = 'flex';
}

function renderBookings(list) {
  const tbody = document.getElementById('bookings-tbody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="state-msg"><span class="icon">📋</span>No bookings yet. Create one above!</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(b => `
    <tr>
      <td>${b.id}</td>
      <td><strong>${b.customer ? b.customer.name : '—'}</strong></td>
      <td>${b.vehicle ? `${b.vehicle.vehicleName} (${b.vehicle.vehicleType})` : '—'}</td>
      <td><code>${b.vehicle ? b.vehicle.numberPlate : '—'}</code></td>
      <td>${b.startDate || '—'}</td>
      <td>${b.endDate || '—'}</td>
      <td style="text-align:center">${b.rentalDays ?? '—'}</td>
      <td class="price">${b.totalCostInr != null ? Number(b.totalCostInr).toLocaleString('en-IN') : '—'}</td>
      <td>${statusBadge(b.status)}</td>
      <td>
        <div class="action-btns">
          ${b.status === 'CONFIRMED' || b.status === 'ACTIVE' ? `
            <button class="btn btn-success btn-sm" onclick="completeBooking(${b.id})">✅ Complete</button>
            <button class="btn btn-danger btn-sm" onclick="cancelBooking(${b.id})">❌ Cancel</button>
          ` : '—'}
        </div>
      </td>
    </tr>
  `).join('');
}

async function createBooking() {
  const customerId = document.getElementById('b-customer').value;
  const vehicleId = document.getElementById('b-vehicle').value;
  const start = document.getElementById('b-start').value;
  const end = document.getElementById('b-end').value;

  if (!customerId || !vehicleId || !start || !end) {
    showToast('⚠️ Please fill all fields', 'warning');
    return;
  }

  if (new Date(end) <= new Date(start)) {
    showToast('⚠️ End date must be after start date', 'warning');
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/bookings?customerId=${customerId}&vehicleId=${vehicleId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startDate: start, endDate: end })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err);
    }

    const booking = await res.json();
    showToast(`✅ Booking confirmed! Total: ${formatINR(booking.totalCostInr)}`, 'success');
    
    document.getElementById('b-customer').value = '';
    document.getElementById('b-vehicle').value = '';
    document.getElementById('b-start').value = '';
    document.getElementById('b-end').value = '';
    document.getElementById('price-preview').style.display = 'none';

    loadBookingsPage();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

async function cancelBooking(id) {
  if (!confirm('Cancel this booking?')) return;
  try {
    await apiPut(`/bookings/${id}/cancel`);
    showToast('❌ Booking cancelled', 'warning');
    loadBookingsPage();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

async function completeBooking(id) {
  if (!confirm('Mark booking as completed?')) return;
  try {
    await apiPut(`/bookings/${id}/complete`);
    showToast('✅ Booking marked completed!', 'success');
    loadBookingsPage();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadBookingsPage);
