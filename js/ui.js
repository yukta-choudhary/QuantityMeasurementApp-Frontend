/* ── Element references ── */
const fromSelect = document.getElementById('from-unit');
const toSelect = document.getElementById('to-unit');
const fromInput = document.getElementById('from-value');
const toInput = document.getElementById('to-value');
const fromError = document.getElementById('from-error');
const toError = document.getElementById('to-error');
const operatorPanel = document.getElementById('operator-panel');
const arrowDivider = document.getElementById('arrow-divider');
const resultArea = document.getElementById('result-area');
const resultPlaceholder = document.getElementById('result-placeholder');
const resultContent = document.getElementById('result-content');
const resultExpr = document.getElementById('result-expression');
const resultNumber = document.getElementById('result-number');
const resultUnit = document.getElementById('result-unit');
const historyList = document.getElementById('history-list');
const historyEmpty = document.getElementById('history-empty');
const errorBanner = document.getElementById('error-banner');
const errorBannerMsg = document.getElementById('error-banner-msg');
const calcBtn = document.getElementById('calculate-btn');

/**
 * Populate a <select> dropdown with unit objects
 */
export function populateDropdown(selectEl, units) {
    selectEl.innerHTML = '';
    const defaultOpt = document.createElement('option');
    defaultOpt.value = '';
    defaultOpt.textContent = 'Select Unit';
    defaultOpt.disabled = true;
    defaultOpt.selected = true;
    selectEl.appendChild(defaultOpt);

    units.forEach(unit => {
        const opt = document.createElement('option');
        opt.value = unit.symbol;
        opt.textContent = unit.label;
        selectEl.appendChild(opt);
    });

    // Default: select first unit if available
    if (units.length > 0) {
        selectEl.value = units[0].symbol;
        return units[0].symbol;
    }
    return '';
}

export function populateBothDropdowns(units) {
    const firstFrom = populateDropdown(fromSelect, units);
    const firstTo = populateDropdown(toSelect, units);
    // Default: select second unit for "to" if exists
    if (units.length > 1) {
        toSelect.value = units[1].symbol;
        return { fromUnit: firstFrom, toUnit: units[1].symbol };
    }
    return { fromUnit: firstFrom, toUnit: firstTo };
}

/**
 * Toggle operator panel visibility based on action
 */
export function toggleOperators(action) {
    if (action === 'Arithmetic') {
        operatorPanel.style.display = 'flex';
        arrowDivider.style.display = 'none';
    } else {
        operatorPanel.style.display = 'none';
        arrowDivider.style.display = 'flex';
    }
}

/**
 * Show a successful result in the result area
 */
export function showResult({ result, expression, unit, isComparison }) {
    resultArea.className = 'result-area active';
    resultPlaceholder.classList.add('hidden');
    resultContent.classList.remove('hidden');

    resultExpr.textContent = expression || '';

    if (isComparison) {
        resultNumber.textContent = result;
        resultNumber.className = 'result-comparison-text';
        resultUnit.textContent = '';
    } else {
        resultNumber.textContent = result;
        resultNumber.className = 'result-number';
        resultUnit.textContent = unit || '';
    }
}

/**
 * Show error result (e.g., divide by zero, NaN)
 */
export function showResultError(message) {
    resultArea.className = 'result-area error-state';
    resultPlaceholder.classList.add('hidden');
    resultContent.classList.remove('hidden');
    resultExpr.textContent = '';
    resultNumber.textContent = message;
    resultNumber.className = 'result-number';
    resultUnit.textContent = '';
}

/**
 * Reset result area to placeholder state
 */
export function resetResult() {
    resultArea.className = 'result-area';
    resultPlaceholder.classList.remove('hidden');
    resultContent.classList.add('hidden');
}

/**
 * Mark input field as valid or invalid
 */
export function setInputValidState(inputEl, errorEl, isValid, errorMsg = '') {
    if (isValid) {
        inputEl.classList.remove('error');
        inputEl.classList.add('valid');
        errorEl.textContent = '';
    } else {
        inputEl.classList.add('error');
        inputEl.classList.remove('valid');
        errorEl.textContent = errorMsg;
    }
}

/**
 * Reset input field to neutral state
 */
export function resetInputState(inputEl, errorEl) {
    inputEl.classList.remove('error', 'valid');
    errorEl.textContent = '';
}

/**
 * Show API error banner
 */
export function showErrorBanner(message) {
    errorBannerMsg.textContent = `⚠ ${message}`;
    errorBanner.classList.remove('hidden');
    calcBtn.disabled = true;
}

/**
 * Hide API error banner
 */
export function hideErrorBanner() {
    errorBanner.classList.add('hidden');
    calcBtn.disabled = false;
}

/**
 * Render the history list
 */
export function renderHistory(records, onDelete) {
    historyList.innerHTML = '';

    if (!records || records.length === 0) {
        historyList.appendChild(historyEmpty);
        historyEmpty.style.display = 'block';
        return;
    }

    historyEmpty.style.display = 'none';

    records.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';
        item.innerHTML = `
      <div class="history-item-type">${record.type} · ${record.action}</div>
      <div class="history-item-expr">${record.expression}</div>
      <div class="history-item-result">${record.result}</div>
      <div class="history-item-time">${formatTimestamp(record.timestamp)}</div>
      <button class="history-item-delete" data-id="${record.id}" title="Delete">✕</button>
    `;
        item.querySelector('.history-item-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            onDelete(record.id);
        });
        historyList.appendChild(item);
    });
}

function formatTimestamp(iso) {
    try {
        const d = new Date(iso);
        return d.toLocaleString('en-IN', {
            day: '2-digit', month: 'short',
            hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return iso;
    }
}

/**
 * Disable dropdowns with 'Unavailable' state
 */
export function setDropdownsUnavailable() {
    [fromSelect, toSelect].forEach(sel => {
        sel.innerHTML = '<option>Unavailable</option>';
        sel.disabled = true;
    });
}

/**
 * Reset all input fields
 */
export function resetInputFields() {
    fromInput.value = '';
    toInput.value = '';
    resetInputState(fromInput, fromError);
    resetInputState(toInput, toError);
}