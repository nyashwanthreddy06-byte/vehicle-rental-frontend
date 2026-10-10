/**
 * vehicles.js — Vehicles page logic
 * Handles CRUD: Add / Edit / Delete vehicles
 * Price per day stored and displayed in Indian Rupees (₹ INR)
 */

let allVehicles = [];
let editingId   = null;

// ── Load & Render ─────────────────────────────────────────
async function loadVehicles() {
  const tbody = document.getElementById('vehicles-tbody');
  tbody.innerHTML = `<tr><td colspan="8" class="state-msg"><div class="loading-spinner"></div></td></tr>`;

  try {
    allVehicles = await apiGet('/vehicles');
    renderVehicles(allVehicles);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="8" class="state-msg"><span class="icon">❌</span>${e.message}</td></tr>`;
  }
}

function renderVehicles(list) {
  const tbody = document.getElementById('vehicles-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="8" class="state-msg"><span class="icon">🚘</span>No vehicles yet. Add one above!</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(v => `
    <tr>
      <td>${v.id}</td>
      <td><strong>${v.vehicleName}</strong></td>
      <td>${v.vehicleType}</td>
      <td>${v.model}</td>
      <td><code>${v.numberPlate}</code></td>
      <td class="price">${Number(v.pricePerDay).toLocaleString('en-IN')}</td>
      <td>${statusBadge(v.status)}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-warning btn-sm" onclick="openEdit(${v.id})">✏ Edit</button>
          <button class="btn btn-danger  btn-sm" onclick="deleteVehicle(${v.id})">🗑 Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Search / Filter ───────────────────────────────────────
function filterVehicles() {
  const q    = document.getElementById('search-input').value.toLowerCase();
  const type = document.getElementById('filter-type').value;
  const stat = document.getElementById('filter-status').value;

  const filtered = allVehicles.filter(v => {
    const matchQ    = !q || v.vehicleName.toLowerCase().includes(q) || v.numberPlate.toLowerCase().includes(q) || v.model.toLowerCase().includes(q);
    const matchType = !type || v.vehicleType === type;
    const matchStat = !stat || v.status === stat;
    return matchQ && matchType && matchStat;
  });
  renderVehicles(filtered);
}

// ── Form ──────────────────────────────────────────────────
function openAdd() {
  editingId = null;
  document.getElementById('form-title').textContent = '➕ Add New Vehicle';
  clearVehicleForm();
  document.getElementById('vehicle-form-section').style.display = 'block';
  document.getElementById('v-name').focus();
  document.getElementById('vehicle-form-section').scrollIntoView({ behavior: 'smooth' });
}

function openEdit(id) {
  const v = allVehicles.find(x => x.id === id);
  if (!v) return;
  editingId = v.id;
  document.getElementById('form-title').textContent = '✏️ Edit Vehicle';
  document.getElementById('v-name').value   = v.vehicleName;
  document.getElementById('v-type').value   = v.vehicleType;
  document.getElementById('v-model').value  = v.model;
  document.getElementById('v-plate').value  = v.numberPlate;
  document.getElementById('v-price').value  = v.pricePerDay;
  document.getElementById('v-status').value = v.status;
  document.getElementById('vehicle-form-section').style.display = 'block';
  document.getElementById('vehicle-form-section').scrollIntoView({ behavior: 'smooth' });
}

function closeForm() {
  document.getElementById('vehicle-form-section').style.display = 'none';
  clearVehicleForm();
  editingId = null;
}

function clearVehicleForm() {
  ['v-name', 'v-model', 'v-plate', 'v-price'].forEach(id => (document.getElementById(id).value = ''));
  document.getElementById('v-type').value   = '';
  document.getElementById('v-status').value = 'AVAILABLE';
}

async function saveVehicle() {
  const name  = document.getElementById('v-name').value.trim();
  const type  = document.getElementById('v-type').value;
  const model = document.getElementById('v-model').value.trim();
  const plate = document.getElementById('v-plate').value.trim().toUpperCase();
  const price = parseFloat(document.getElementById('v-price').value);
  const stat  = document.getElementById('v-status').value;

  if (!name || !type || !model || !plate || isNaN(price) || price <= 0) {
    showToast('⚠️ Please fill all required fields with valid values', 'warning');
    return;
  }

  const body = { vehicleName: name, vehicleType: type, model, numberPlate: plate, pricePerDay: price, status: stat };

  try {
    if (editingId) {
      await apiPut(`/vehicles/${editingId}`, body);
      showToast('✅ Vehicle updated successfully!', 'success');
    } else {
      await apiPost('/vehicles', body);
      showToast('✅ Vehicle added successfully!', 'success');
    }
    closeForm();
    loadVehicles();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

async function deleteVehicle(id) {
  const v = allVehicles.find(x => x.id === id);
  if (!confirm(`Delete "${v?.vehicleName}"? This cannot be undone.`)) return;
  try {
    await apiDelete(`/vehicles/${id}`);
    showToast('🗑 Vehicle deleted', 'warning');
    loadVehicles();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadVehicles);
