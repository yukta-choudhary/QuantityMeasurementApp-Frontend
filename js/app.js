import { state, resetState } from './state.js';
import * as api from './api.js';
import * as ui from './ui.js';
import {
    validateInput,
    performConversion,
    performComparison,
    performArithmetic,
    formatResult,
} from './conversion.js';

/* ── Element references ── */
const typeGrid = document.getElementById('type-grid');
const actionTabs = document.getElementById('action-tabs');
const fromValueInput = document.getElementById('from-value');
const toValueInput = document.getElementById('to-value');
const fromUnitSelect = document.getElementById('from-unit');
const toUnitSelect = document.getElementById('to-unit');
const fromError = document.getElementById('from-error');
const toError = document.getElementById('to-error');
const opBtns = document.querySelectorAll('.op-btn');
const calculateBtn = document.getElementById('calculate-btn');
const resetBtn = document.getElementById('reset-btn');
const historyToggle = document.getElementById('history-toggle-btn');
const historySidebar = document.getElementById('history-sidebar');
const historyClearBtn = document.getElementById('history-clear-btn');
const errBannerClose = document.getElementById('error-banner-close');

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', async () => {
    await loadUnitsForType(state.selectedType);
    await loadHistory();
});

/* ============================================================
   Load units for a type, then populate dropdowns
   ============================================================ */
async function loadUnitsForType(type) {
    try {
        ui.hideErrorBanner();
        const units = await api.getUnits(type);
        state.units = units;

        if (units.length === 0) {
            ui.showErrorBanner('No units available for this type.');
            return;
        }

        const { fromUnit, toUnit } = ui.populateBothDropdowns(units);
        state.fromUnit = fromUnit;
        state.toUnit = toUnit;

    } catch (err) {
        console.error('Error loading units:', err);
        ui.showErrorBanner('Could not load units. Is json-server running on port 3000?');
        ui.setDropdownsUnavailable();
    }
}

/* ============================================================
   Select Measurement Type
   ============================================================ */
typeGrid.addEventListener('click', async (e) => {
    const card = e.target.closest('.type-card');
    if (!card) return;

    const type = card.dataset.type;
    if (type === state.selectedType) return; // idempotent

    // Update active state
    typeGrid.querySelectorAll('.type-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');

    state.selectedType = type;

    // Reset inputs & result
    ui.resetInputFields();
    ui.resetResult();
    resetState();
    state.selectedType = type;
    state.selectedAction = state.selectedAction; // preserve action

    await loadUnitsForType(type);
});

/* ============================================================
   Select Action Mode
   ============================================================ */
actionTabs.addEventListener('click', (e) => {
    const tab = e.target.closest('.action-tab');
    if (!tab) return;

    const action = tab.dataset.action;
    actionTabs.querySelectorAll('.action-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    state.selectedAction = action;
    ui.toggleOperators(action);
    ui.resetResult();

    // Reset operator to default on Arithmetic switch
    if (action === 'Arithmetic') {
        state.operator = '+';
        opBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.op === '+');
        });
    }
});

/* ============================================================
   Enter Numeric Value (real-time validation)
   ============================================================ */
fromValueInput.addEventListener('input', () => {
    state.fromValue = fromValueInput.value;
    const { valid, error } = validateInput(state.fromValue);
    ui.setInputValidState(fromValueInput, fromError, valid, error);
});

toValueInput.addEventListener('input', () => {
    state.toValue = toValueInput.value;
    const { valid, error } = validateInput(state.toValue);
    ui.setInputValidState(toValueInput, toError, valid, error);
});

// Blur: show 'required' if empty
fromValueInput.addEventListener('blur', () => {
    if (fromValueInput.value === '') {
        ui.setInputValidState(fromValueInput, fromError, false, 'This field is required');
    }
});

toValueInput.addEventListener('blur', () => {
    if (toValueInput.value === '') {
        // Only required in Comparison and Arithmetic modes
        if (state.selectedAction !== 'Conversion') {
            ui.setInputValidState(toValueInput, toError, false, 'This field is required');
        }
    }
});

/* ============================================================
   Select Source Unit
   ============================================================ */
fromUnitSelect.addEventListener('change', () => {
    state.fromUnit = fromUnitSelect.value;
});

/* ============================================================
   Select Target Unit
   ============================================================ */
toUnitSelect.addEventListener('change', () => {
    state.toUnit = toUnitSelect.value;
});

/* ============================================================
   Select Arithmetic Operator
   ============================================================ */
opBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        opBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.operator = btn.dataset.op;
    });
});

/* ============================================================
   CALCULATE BUTTON — dispatches
   ============================================================ */
calculateBtn.addEventListener('click', async () => {
    await handleCalculate();
});

async function handleCalculate() {
    // Validate FROM value (always required)
    const fromValidation = validateInput(state.fromValue);
    if (!fromValidation.valid) {
        ui.setInputValidState(fromValueInput, fromError, false, fromValidation.error);
        return;
    }

    const fromVal = parseFloat(state.fromValue);

    // Validate TO value (required for Comparison and Arithmetic)
    let toVal = null;
    if (state.selectedAction === 'Comparison' || state.selectedAction === 'Arithmetic') {
        const toValidation = validateInput(state.toValue);
        if (!toValidation.valid) {
            ui.setInputValidState(toValueInput, toError, false, toValidation.error);
            return;
        }
        toVal = parseFloat(state.toValue);
    }

    // Validate unit selections
    if (!state.fromUnit) {
        ui.showResultError('Please select a FROM unit');
        return;
    }
    if (!state.toUnit) {
        ui.showResultError('Please select a TO unit');
        return;
    }

    // Fetch conversion record from API
    let conversionRecord = null;
    if (state.fromUnit !== state.toUnit) {
        try {
            if (state.selectedAction === 'Conversion') {
                conversionRecord = await api.getConversion(state.fromUnit, state.toUnit);
            } else if (state.selectedAction === 'Comparison' || state.selectedAction === 'Arithmetic') {
                // We need toUnit → fromUnit to normalize
                conversionRecord = await api.getConversion(state.toUnit, state.fromUnit);
            }

            if (!conversionRecord && state.fromUnit !== state.toUnit) {
                ui.showResultError('Conversion not available for this unit pair');
                return;
            }
        } catch (err) {
            console.error('[API] Conversion fetch failed:', err);
            ui.showErrorBanner('Service unavailable. Check if json-server is running.');
            return;
        }
    }

    let output = null;

    switch (state.selectedAction) {
        // ── Perform Conversion ──
        case 'Conversion': {
            let conv = conversionRecord;
            if (state.fromUnit === state.toUnit) conv = { factor: 1 };
            output = performConversion(fromVal, state.fromUnit, state.toUnit, conv);
            if (output) output.result = formatResult(output.result);
            break;
        }

        // ── Perform Comparison ──
        case 'Comparison': {
            output = performComparison(fromVal, state.fromUnit, toVal, state.toUnit, conversionRecord);
            break;
        }

        // ── Perform Arithmetic ──
        case 'Arithmetic': {
            output = performArithmetic(fromVal, state.fromUnit, toVal, state.toUnit, state.operator, conversionRecord);
            if (output?.error) {
                ui.showResultError(output.error); // division by zero
                return;
            }
            if (output) output.result = formatResult(output.result);
            break;
        }
    }

    if (!output) {
        ui.showResultError('Invalid calculation');
        return;
    }

    // ── Display Result ──
    ui.showResult(output);

    // ── Save to History (non-blocking) ──
    const historyRecord = {
        type: state.selectedType,
        action: state.selectedAction,
        expression: output.expression,
        result: output.isComparison ? output.result : `${output.result} ${output.unit || ''}`,
        timestamp: new Date().toISOString(),
    };

    try {
        await api.postHistory(historyRecord);
        await loadHistory(); // refresh panel
    } catch (err) {
        console.warn('History save failed (non-blocking):', err);
    }
}

/* ============================================================
   Clear / Reset Form
   ============================================================ */
resetBtn.addEventListener('click', () => {
    fromValueInput.value = '';
    toValueInput.value = '';
    state.fromValue = '';
    state.toValue = '';
    state.operator = '+';

    // Reset operator buttons
    opBtns.forEach(b => b.classList.toggle('active', b.dataset.op === '+'));

    // Reset dropdowns to first option
    if (state.units.length > 0) {
        fromUnitSelect.value = state.units[0].symbol;
        toUnitSelect.value = state.units.length > 1 ? state.units[1].symbol : state.units[0].symbol;
        state.fromUnit = fromUnitSelect.value;
        state.toUnit = toUnitSelect.value;
    }

    ui.resetInputFields();
    ui.resetResult();
});

/* ============================================================
   Load & Render History
   ============================================================ */
async function loadHistory() {
    try {
        const records = await api.getHistory();
        ui.renderHistory(records, handleDeleteHistory);
    } catch (err) {
        console.error('History load failed:', err);
        ui.renderHistory([], null);
    }
}

async function handleDeleteHistory(id) {
    try {
        await api.deleteHistory(id);
        await loadHistory();
    } catch (err) {
        console.error('Delete failed:', err);
    }
}

historyClearBtn.addEventListener('click', async () => {
    if (!confirm('Clear all history?')) return;
    try {
        await api.clearAllHistory();
        await loadHistory();
    } catch (err) {
        console.error('Clear all failed:', err);
    }
});

/* ============================================================
   History sidebar toggle (mobile)
   Uses .open class — CSS controls display per breakpoint.
   On desktop (>768px) sidebar is always visible via CSS.
   On mobile it toggles the .open class.
   ============================================================ */
historyToggle.addEventListener('click', () => {
    historySidebar.classList.toggle('open');
});

/* ============================================================
   Close error banner
   ============================================================ */
errBannerClose.addEventListener('click', () => {
    ui.hideErrorBanner();
});