/**
 * customers.js — Customers page logic
 * Handles CRUD: Add / Edit / Delete customers
 * Validates Indian mobile numbers (10 digits, starts with 6–9)
 */

let allCustomers = [];
let editingId    = null;

// ── Load & Render ─────────────────────────────────────────
async function loadCustomers() {
  const tbody = document.getElementById('customers-tbody');
  tbody.innerHTML = `<tr><td colspan="6" class="state-msg"><div class="loading-spinner"></div></td></tr>`;

  try {
    allCustomers = await apiGet('/customers');
    renderCustomers(allCustomers);
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6" class="state-msg"><span class="icon">❌</span>${e.message}</td></tr>`;
  }
}

function renderCustomers(list) {
  const tbody = document.getElementById('customers-tbody');
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="state-msg"><span class="icon">👥</span>No customers yet. Add one above!</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map(c => `
    <tr>
      <td>${c.id}</td>
      <td><strong>${c.name}</strong></td>
      <td>${c.email}</td>
      <td>${c.phone}</td>
      <td>${c.address || '<span style="color:var(--muted)">—</span>'}</td>
      <td>
        <div class="action-btns">
          <button class="btn btn-warning btn-sm" onclick="openEdit(${c.id})">✏ Edit</button>
          <button class="btn btn-danger  btn-sm" onclick="deleteCustomer(${c.id})">🗑 Delete</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Search ────────────────────────────────────────────────
function filterCustomers() {
  const q = document.getElementById('search-input').value.toLowerCase();
  const filtered = allCustomers.filter(c =>
    c.name.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) ||
    c.phone.includes(q)
  );
  renderCustomers(filtered);
}

// ── Form ──────────────────────────────────────────────────
function openAdd() {
  editingId = null;
  document.getElementById('form-title').textContent = '➕ Add New Customer';
  clearForm();
  document.getElementById('customer-form-section').style.display = 'block';
  document.getElementById('c-name').focus();
  document.getElementById('customer-form-section').scrollIntoView({ behavior: 'smooth' });
}

function openEdit(id) {
  const c = allCustomers.find(x => x.id === id);
  if (!c) return;
  editingId = c.id;
  document.getElementById('form-title').textContent  = '✏️ Edit Customer';
  document.getElementById('c-name').value    = c.name;
  document.getElementById('c-email').value   = c.email;
  document.getElementById('c-phone').value   = c.phone;
  document.getElementById('c-address').value = c.address || '';
  document.getElementById('customer-form-section').style.display = 'block';
  document.getElementById('customer-form-section').scrollIntoView({ behavior: 'smooth' });
}

function closeForm() {
  document.getElementById('customer-form-section').style.display = 'none';
  clearForm();
  editingId = null;
}

function clearForm() {
  ['c-name', 'c-email', 'c-phone', 'c-address'].forEach(id => (document.getElementById(id).value = ''));
}

function validateIndianPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

async function saveCustomer() {
  const name    = document.getElementById('c-name').value.trim();
  const email   = document.getElementById('c-email').value.trim();
  const phone   = document.getElementById('c-phone').value.trim();
  const address = document.getElementById('c-address').value.trim();

  if (!name) { showToast('⚠️ Name is required', 'warning'); return; }
  if (!email || !/\S+@\S+\.\S+/.test(email)) { showToast('⚠️ Enter a valid email', 'warning'); return; }
  if (!validateIndianPhone(phone)) {
    showToast('⚠️ Enter a valid 10-digit Indian mobile number (starts with 6–9)', 'warning');
    return;
  }

  const body = { name, email, phone, address };

  try {
    if (editingId) {
      await apiPut(`/customers/${editingId}`, body);
      showToast('✅ Customer updated!', 'success');
    } else {
      await apiPost('/customers', body);
      showToast('✅ Customer added!', 'success');
    }
    closeForm();
    loadCustomers();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

async function deleteCustomer(id) {
  const c = allCustomers.find(x => x.id === id);
  if (!confirm(`Delete customer "${c?.name}"?`)) return;
  try {
    await apiDelete(`/customers/${id}`);
    showToast('🗑 Customer deleted', 'warning');
    loadCustomers();
  } catch (e) {
    showToast('❌ ' + e.message, 'error');
  }
}

document.addEventListener('DOMContentLoaded', loadCustomers);
