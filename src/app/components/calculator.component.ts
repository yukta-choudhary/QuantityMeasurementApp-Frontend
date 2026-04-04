import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';

type MeasurementType = 'Length' | 'Weight' | 'Temperature' | 'Volume';
type ActionType = 'Comparison' | 'Conversion' | 'Arithmetic';
type OperatorType = '+' | '-' | '/';

type UnitOption = {
  symbol: string;
  label: string;
};

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculator.component.html',
  styleUrl: './calculator.component.css',
})
export class CalculatorComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly typeOptions: Array<{ type: MeasurementType; icon: string }> = [
    { type: 'Length', icon: '📏' },
    { type: 'Weight', icon: '⚖️' },
    { type: 'Temperature', icon: '🌡️' },
    { type: 'Volume', icon: '💧' }
  ];

  readonly actionOptions: ActionType[] = ['Comparison', 'Conversion', 'Arithmetic'];
  readonly operatorOptions: OperatorType[] = ['+', '-', '/'];

  readonly unitsByType: Record<MeasurementType, UnitOption[]> = {
    Length: [
      { symbol: 'FEET', label: 'Feet' },
      { symbol: 'INCHES', label: 'Inches' },
      { symbol: 'YARD', label: 'Yard' },
      { symbol: 'CENTIMETER', label: 'Centimeter' }
    ],
    Weight: [
      { symbol: 'KILOGRAM', label: 'Kilogram' },
      { symbol: 'GRAM', label: 'Gram' },
      { symbol: 'POUND', label: 'Pound' },
      { symbol: 'TONNE', label: 'Tonne' }
    ],
    Temperature: [
      { symbol: 'CELSIUS', label: 'Celsius' },
      { symbol: 'FAHRENHEIT', label: 'Fahrenheit' },
      { symbol: 'KELVIN', label: 'Kelvin' }
    ],
    Volume: [
      { symbol: 'LITRE', label: 'Litre' },
      { symbol: 'MILLILITRE', label: 'Millilitre' },
      { symbol: 'GALLON', label: 'Gallon' },
      { symbol: 'CUBIC_FEET', label: 'Cubic Feet' }
    ]
  };

  selectedType = signal<MeasurementType>('Length');
  selectedAction = signal<ActionType>('Comparison');
  selectedOperator = signal<OperatorType>('+');

  fromValue = '';
  toValue = '';
  fromUnit = 'FEET';
  toUnit = 'INCHES';

  result = signal<any>(null);
  error = signal('');
  history = signal<any[]>([]);
  mobileHistoryOpen = signal(false);

  readonly currentUnits = computed(() => this.unitsByType[this.selectedType()]);

  canCalculate(): boolean {
  const fromVal =
    this.fromValue !== null && this.fromValue !== undefined
      ? String(this.fromValue).trim()
      : '';

  const toVal =
    this.toValue !== null && this.toValue !== undefined
      ? String(this.toValue).trim()
      : '';

  if (!fromVal) return false;
  if (this.selectedAction() !== 'Conversion' && !toVal) return false;
  if (!this.fromUnit || !this.toUnit) return false;

  return true;
}

  readonly resultDisplay = computed(() => {
    const res = this.result();
    if (!res) return null;

    if (res.resultString != null && res.resultString !== '') {
      return {
        expression: this.buildExpression(),
        value: res.resultString,
        unit: '',
        isComparison: true
      };
    }

    return {
      expression: this.buildExpression(),
      value: res.resultValue ?? '',
      unit: res.resultUnit ?? '',
      isComparison: false
    };
  });

  async ngOnInit(): Promise<void> {
    const user = this.auth.getSessionUser();
    if (!user) {
      await this.router.navigate(['/login']);
      return;
    }

    this.setDefaultUnits();
    await this.loadHistory();
  }

  get userInitials(): string {
    const user = this.auth.getSessionUser();
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map((part: string) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get userFirstName(): string {
    const user = this.auth.getSessionUser();
    return user?.name?.split(' ')[0] ?? 'User';
  }

  changeType(type: MeasurementType): void {
    this.selectedType.set(type);
    this.setDefaultUnits();
    this.result.set(null);
    this.error.set('');
    this.loadHistory();
  }

  changeAction(action: ActionType): void {
    this.selectedAction.set(action);
    this.result.set(null);
    this.error.set('');
  }

  selectOperator(operator: OperatorType): void {
    this.selectedOperator.set(operator);
  }

  setDefaultUnits(): void {
    const units = this.currentUnits();
    this.fromUnit = units[0]?.symbol ?? '';
    this.toUnit = units[1]?.symbol ?? units[0]?.symbol ?? '';
    this.fromValue = '';
    this.toValue = '';
  }

  resetForm(): void {
    this.fromValue = '';
    this.toValue = '';
    const units = this.currentUnits();
    this.fromUnit = units[0]?.symbol ?? '';
    this.toUnit = units[1]?.symbol ?? units[0]?.symbol ?? '';
    this.selectedOperator.set('+');
    this.result.set(null);
    this.error.set('');
  }

  toggleHistorySidebar(): void {
    this.mobileHistoryOpen.update(v => !v);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private mapType(type: MeasurementType): string {
    switch (type) {
      case 'Length': return 'LengthUnit';
      case 'Weight': return 'WeightUnit';
      case 'Temperature': return 'TemperatureUnit';
      case 'Volume': return 'VolumeUnit';
    }
  }

  private getOperationFromUI(): 'add' | 'subtract' | 'divide' | 'compare' | 'convert' {
    const action = this.selectedAction();

    if (action === 'Comparison') return 'compare';
    if (action === 'Conversion') return 'convert';

    const op = this.selectedOperator();
    if (op === '+') return 'add';
    if (op === '-') return 'subtract';
    return 'divide';
  }

  private buildExpression(): string {
    const operation = this.getOperationFromUI();

    if (operation === 'compare') {
      return `${this.fromValue} ${this.fromUnit} = ${this.toValue} ${this.toUnit}`;
    }
    if (operation === 'convert') {
      return `${this.fromValue} ${this.fromUnit} → ${this.toUnit}`;
    }
    if (operation === 'add') {
      return `${this.fromValue} ${this.fromUnit} + ${this.toValue} ${this.toUnit}`;
    }
    if (operation === 'subtract') {
      return `${this.fromValue} ${this.fromUnit} - ${this.toValue} ${this.toUnit}`;
    }
    return `${this.fromValue} ${this.fromUnit} ÷ ${this.toValue} ${this.toUnit}`;
  }

  async onCalculateClick(): Promise<void> {
  const fromVal =
    this.fromValue !== null && this.fromValue !== undefined
      ? String(this.fromValue).trim()
      : '';

  const toVal =
    this.toValue !== null && this.toValue !== undefined
      ? String(this.toValue).trim()
      : '';

  if (!fromVal) {
    this.error.set('Please enter FROM value.');
    return;
  }

  if (this.selectedAction() !== 'Conversion' && !toVal) {
    this.error.set('Please enter TO value.');
    return;
  }

  if (!this.fromUnit || !this.toUnit) {
    this.error.set('Please select units.');
    return;
  }

  this.error.set('');
  await this.calculate(this.getOperationFromUI());
}

  async calculate(operation: string): Promise<void> {
    this.error.set('');
    this.result.set(null);

    const payload = {
      thisQuantityDTO: {
        value: Number(this.fromValue),
        unit: this.fromUnit,
        measurementType: this.mapType(this.selectedType())
      },
      thatQuantityDTO: {
        value: operation === 'convert' ? 0 : Number(this.toValue),
        unit: this.toUnit,
        measurementType: this.mapType(this.selectedType())
      }
    };

    try {
      let response: any;

      switch (operation) {
        case 'add':
          response = await this.api.post('/api/v1/quantities/add', payload);
          break;
        case 'subtract':
          response = await this.api.post('/api/v1/quantities/subtract', payload);
          break;
        case 'divide':
          response = await this.api.post('/api/v1/quantities/divide', payload);
          break;
        case 'compare':
          response = await this.api.post('/api/v1/quantities/compare', payload);
          break;
        case 'convert':
          response = await this.api.post('/api/v1/quantities/convert', payload);
          break;
        default:
          this.error.set('Invalid operation');
          return;
      }

      this.result.set(response);
      await this.loadHistory();

    } catch (err: any) {
      console.error(err);
      this.error.set(err?.error?.message || 'Something went wrong');
    }
  }

  async loadHistory(): Promise<void> {
    try {
      const type = this.mapType(this.selectedType());
      const response = await this.api.get<any[]>(`/api/v1/quantities/history/type/${type}`);
      this.history.set(response);
    } catch (err) {
      console.error('History fetch failed', err);
      this.history.set([]);
    }
  }

  async clearHistory(): Promise<void> {
    this.history.set([]);
  }

  formatHistoryResult(record: any): string {
    if (record?.resultString) return record.resultString;
    return `${record?.resultValue ?? ''} ${record?.resultUnit ?? ''}`.trim();
  }

  formatHistoryExpression(record: any): string {
    const left = `${record?.thisValue ?? ''} ${record?.thisUnit ?? ''}`.trim();
    const right = `${record?.thatValue ?? ''} ${record?.thatUnit ?? ''}`.trim();
    return `${left} → ${right}`;
  }
}