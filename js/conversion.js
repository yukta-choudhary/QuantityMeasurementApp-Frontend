/**
 * Validate that a value is a finite number
 * Returns { valid: boolean, error: string }
 */
export function validateInput(value) {
    if (value === '' || value === null || value === undefined) {
        return { valid: false, error: 'This field is required' };
    }
    const num = parseFloat(value);
    if (isNaN(num) || !isFinite(num)) {
        return { valid: false, error: 'Please enter a valid number' };
    }
    return { valid: true, error: '' };
}

/**
 * Apply a conversion record (factor or formula) to a value.
 * formula uses `v` as the variable name.
 */
export function applyConversion(conversionRecord, value) {
    if (!conversionRecord) return null;
    if (conversionRecord.factor !== null && conversionRecord.factor !== undefined) {
        return value * conversionRecord.factor;
    }
    if (conversionRecord.formula) {
        // Safe formula evaluation with v as variable
        const v = value; // eslint-disable-line no-unused-vars
        try {
            // eslint-disable-next-line no-new-func
            return Function('v', `return ${conversionRecord.formula}`)(value);
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * Perform a unit conversion
 * Returns { result, expression, unit }
 */
export function performConversion(fromValue, fromUnit, toUnit, conversionRecord) {
    // Same unit = identity
    if (fromUnit === toUnit) {
        return {
            result: fromValue,
            expression: `${fromValue} ${fromUnit} → ${toUnit}`,
            unit: toUnit,
        };
    }

    const result = applyConversion(conversionRecord, fromValue);
    if (result === null) return null;

    return {
        result,
        expression: `${fromValue} ${fromUnit} → ${toUnit}`,
        unit: toUnit,
    };
}

/**
 * Perform a comparison
 * Both values are converted to a common base (fromUnit) then compared.
 * conversionToFrom: conversion record toUnit → fromUnit
 * Returns { result (text string), expression }
 */
export function performComparison(fromValue, fromUnit, toValue, toUnit, conversionRecord) {
    let fromBase = fromValue;
    let toBase;

    if (fromUnit === toUnit) {
        toBase = toValue;
    } else {
        // Convert toValue into fromUnit space
        toBase = applyConversion(conversionRecord, toValue);
        if (toBase === null) return null;
    }

    let symbol;
    if (fromBase > toBase) symbol = '>';
    else if (fromBase < toBase) symbol = '<';
    else symbol = '=';

    return {
        result: `${fromValue} ${fromUnit} ${symbol} ${toValue} ${toUnit}`,
        expression: `${fromValue} ${fromUnit} vs ${toValue} ${toUnit}`,
        isComparison: true,
    };
}

/**
 * Perform arithmetic
 * toValue is converted to fromUnit first, then the operator is applied.
 * conversionRecord: toUnit → fromUnit
 * Returns { result, expression, unit }
 */
export function performArithmetic(fromValue, fromUnit, toValue, toUnit, operator, conversionRecord) {
    let normalizedTo;

    if (fromUnit === toUnit) {
        normalizedTo = toValue;
    } else {
        normalizedTo = applyConversion(conversionRecord, toValue);
        if (normalizedTo === null) return null;
    }

    // exception: division by zero
    if (operator === '/' && normalizedTo === 0) {
        return { error: 'Cannot divide by zero' };
    }

    let result;
    switch (operator) {
        case '+': result = fromValue + normalizedTo; break;
        case '-': result = fromValue - normalizedTo; break;
        case '*': result = fromValue * normalizedTo; break;
        case '/': result = fromValue / normalizedTo; break;
        default: return null;
    }

    const opSymbol = { '+': '+', '-': '−', '*': '×', '/': '÷' }[operator];
    const expression = `${fromValue} ${fromUnit} ${opSymbol} ${toValue} ${toUnit}`;

    return { result, expression, unit: fromUnit };
}

/**
 * Format a result number nicely (up to 6 significant figures, no trailing zeros)
 */
export function formatResult(value) {
    if (!isFinite(value)) return 'Invalid';
    const formatted = parseFloat(Number(value).toPrecision(8));
    // Remove unnecessary trailing zeros
    return String(formatted);
}