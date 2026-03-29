// js/state.js
// Central state for the application

export const state = {
    selectedType: 'Length',
    selectedAction: 'Comparison',
    fromValue: '',
    toValue: '',
    fromUnit: '',
    toUnit: '',
    operator: '+',
    units: [],
};

export function resetState() {
    state.fromValue = '';
    state.toValue = '';
    state.fromUnit = '';
    state.toUnit = '';
    state.operator = '+';
    state.units = [];
}