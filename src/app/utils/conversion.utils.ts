import { CalculationOutput, ConversionRecord, OperatorType } from '../models/models';

export function validateInput(value: string | null | undefined): { valid: boolean; error: string } {
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'This field is required' };
  }

  const num = parseFloat(value);
  if (Number.isNaN(num) || !Number.isFinite(num)) {
    return { valid: false, error: 'Please enter a valid number' };
  }

  return { valid: true, error: '' };
}

export function applyConversion(conversionRecord: ConversionRecord | null, value: number): number | null {
  if (!conversionRecord) return null;

  if (conversionRecord.factor !== null && conversionRecord.factor !== undefined) {
    return value * conversionRecord.factor;
  }

  if (conversionRecord.formula) {
    try {
      return Function('v', `return ${conversionRecord.formula}`)(value) as number;
    } catch {
      return null;
    }
  }

  return null;
}

export function performConversion(
  fromValue: number,
  fromUnit: string,
  toUnit: string,
  conversionRecord: ConversionRecord | null
): CalculationOutput | null {
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

export function performComparison(
  fromValue: number,
  fromUnit: string,
  toValue: number,
  toUnit: string,
  conversionRecord: ConversionRecord | null
): CalculationOutput | null {
  const fromBase = fromValue;
  let toBase: number;

  if (fromUnit === toUnit) {
    toBase = toValue;
  } else {
    const normalized = applyConversion(conversionRecord, toValue);
    if (normalized === null) return null;
    toBase = normalized;
  }

  let symbol = '=';
  if (fromBase > toBase) symbol = '>';
  else if (fromBase < toBase) symbol = '<';

  return {
    result: `${fromValue} ${fromUnit} ${symbol} ${toValue} ${toUnit}`,
    expression: `${fromValue} ${fromUnit} vs ${toValue} ${toUnit}`,
    isComparison: true,
  };
}

export function performArithmetic(
  fromValue: number,
  fromUnit: string,
  toValue: number,
  toUnit: string,
  operator: OperatorType,
  conversionRecord: ConversionRecord | null
): CalculationOutput | null {
  let normalizedTo: number;

  if (fromUnit === toUnit) {
    normalizedTo = toValue;
  } else {
    const normalized = applyConversion(conversionRecord, toValue);
    if (normalized === null) return null;
    normalizedTo = normalized;
  }

  if (operator === '/' && normalizedTo === 0) {
    return { error: 'Cannot divide by zero', expression: '' };
  }

  let result: number;
  switch (operator) {
    case '+':
      result = fromValue + normalizedTo;
      break;
    case '-':
      result = fromValue - normalizedTo;
      break;
    case '*':
      result = fromValue * normalizedTo;
      break;
    case '/':
      result = fromValue / normalizedTo;
      break;
    default:
      return null;
  }

  const opSymbol: Record<OperatorType, string> = { '+': '+', '-': '−', '*': '×', '/': '÷' };
  return {
    result,
    expression: `${fromValue} ${fromUnit} ${opSymbol[operator]} ${toValue} ${toUnit}`,
    unit: fromUnit,
  };
}

export function formatResult(value: number): string {
  if (!Number.isFinite(value)) return 'Invalid';
  const formatted = parseFloat(Number(value).toPrecision(8));
  return String(formatted);
}

export function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
