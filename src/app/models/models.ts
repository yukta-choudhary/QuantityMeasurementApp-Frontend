export type MeasurementType = 'Length' | 'Weight' | 'Temperature' | 'Volume';
export type ActionType = 'Comparison' | 'Conversion' | 'Arithmetic';
export type OperatorType = '+' | '-' | '*' | '/';

export interface Unit {
  id: number;
  type: MeasurementType;
  label: string;
  symbol: string;
}

export interface ConversionRecord {
  id: number;
  from: string;
  to: string;
  factor: number | null;
  formula: string | null;
}

export interface HistoryRecord {
  id?: number;
  type: MeasurementType;
  action: ActionType;
  expression: string;
  result: string;
  timestamp: string;
}

export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  mobile: string;
  createdAt: string;
}

export interface SessionUser {
  id: number;
  name: string;
  email: string;
}

export interface CalculationOutput {
  result?: number | string;
  expression: string;
  unit?: string;
  isComparison?: boolean;
  error?: string;
}

export interface AppState {
  selectedType: MeasurementType;
  selectedAction: ActionType;
  fromValue: string;
  toValue: string;
  fromUnit: string;
  toUnit: string;
  operator: OperatorType;
  units: Unit[];
}
