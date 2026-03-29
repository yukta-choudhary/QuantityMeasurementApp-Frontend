const BASE_URL = 'http://localhost:3000';

/**
 * Fetch all units for a given measurement type
 * GET /units?type=Length
 */
export async function getUnits(type) {
    const res = await fetch(`${BASE_URL}/units?type=${encodeURIComponent(type)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load units`);
    return res.json();
}

/**
 * Fetch conversion factor or formula between two units
 * GET /conversions?from=km&to=m
 */
export async function getConversion(from, to) {
    const res = await fetch(`${BASE_URL}/conversions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load conversion`);
    const data = await res.json();
    return data[0] || null; // json-server returns array
}

/**
 * Save calculation result to history
 * POST /history
 */
export async function postHistory(record) {
    const res = await fetch(`${BASE_URL}/history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to save history`);
    return res.json();
}

/**
 * Fetch all history records, newest first
 * GET /history?_sort=timestamp&_order=desc
 */
export async function getHistory() {
    const res = await fetch(`${BASE_URL}/history?_sort=timestamp&_order=desc`);
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to load history`);
    return res.json();
}

/**
 * Delete a single history record
 * DELETE /history/:id
 */
export async function deleteHistory(id) {
    const res = await fetch(`${BASE_URL}/history/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP ${res.status}: Failed to delete history item`);
    return true;
}

/**
 * (clear all): Delete all history records one by one
 */
export async function clearAllHistory() {
    const records = await getHistory();
    await Promise.all(records.map(r => deleteHistory(r.id)));
}