/**
 * api.js — Shared API configuration and utility functions
 * All amounts are in Indian Rupees (₹ INR)
 */

const API_BASE = 'http://localhost:8080/api';

// ── HTTP helpers ──────────────────────────────────────────
async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function apiPut(path, body = null) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : null,
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `PUT ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `DELETE ${path} failed: ${res.status}`);
  }
}

// ── Formatting ────────────────────────────────────────────
/**
 * Format a number as Indian Rupees — e.g. ₹1,50,000
 */
function formatINR(amount) {
  if (amount == null || isNaN(amount)) return '—';
  return '₹' + Number(amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

/**
 * Build a status badge span element
 */
function statusBadge(status = '') {
  const cls = 'badge badge-' + status.toLowerCase();
  return `<span class="${cls}">${status}</span>`;
}

// ── Toast ─────────────────────────────────────────────────
function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  if (!t) return;

  let text = msg;
  // If the message starts with an emoji, check if the remaining is JSON
  const match = typeof msg === 'string' ? msg.match(/^([^\w\s{[]+\s*)(.*)$/) : null;
  const prefix = match ? match[1] : '';
  const candidate = match ? match[2] : msg;

  if (typeof candidate === 'string' && candidate.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(candidate.trim());
      text = prefix + (parsed.message || parsed.error || candidate);
    } catch (e) {
      // Keep as-is
    }
  }

  t.textContent = text;
  t.className = 'show ' + type;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => (t.className = ''), 3500);
}

// ── Clock ─────────────────────────────────────────────────
function startClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const tick = () => {
    el.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  tick();
  setInterval(tick, 1000);
}

document.addEventListener('DOMContentLoaded', startClock);
