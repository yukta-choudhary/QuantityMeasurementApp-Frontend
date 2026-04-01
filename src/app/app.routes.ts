import { Routes } from '@angular/router';
import { LoginComponent } from './components/login.component';
import { CalculatorComponent } from './components/calculator.component';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'calculator', component: CalculatorComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' },
];
