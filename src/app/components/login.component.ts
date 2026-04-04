
import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly toast = inject(ToastService);

  readonly activeTab = signal<'login' | 'signup'>('login');
  readonly showLoginPassword = signal(false);
  readonly showSignupPassword = signal(false);
  readonly loginLoading = signal(false);
  readonly signupLoading = signal(false);

  readonly loginEmail = signal('');
  readonly loginPassword = signal('');
  readonly signupName = signal('');
  readonly signupEmail = signal('');
  readonly signupPassword = signal('');
  readonly signupMobile = signal('');

  readonly loginEmailErr = signal('');
  readonly loginPassErr = signal('');
  readonly signupNameErr = signal('');
  readonly signupEmailErr = signal('');
  readonly signupPassErr = signal('');
  readonly signupMobileErr = signal('');

  readonly toastClass = computed(() => `toast ${this.toast.type()} ${this.toast.visible() ? 'show' : ''}`.trim());

  showLogin(): void {
    this.activeTab.set('login');
  }

  showSignup(): void {
    this.activeTab.set('signup');
  }

  toggleLoginPassword(): void {
    this.showLoginPassword.update((v) => !v);
  }

  toggleSignupPassword(): void {
    this.showSignupPassword.update((v) => !v);
  }

  private isEmail(v: string): boolean {
    return /^\S+@\S+\.\S+$/.test(v);
  }

  private isMobile(v: string): boolean {
    return /^\d{10}$/.test(v);
  }

  private setFieldError(
    field: 'loginEmailErr' | 'loginPassErr' | 'signupNameErr' | 'signupEmailErr' | 'signupPassErr' | 'signupMobileErr',
    value: string
  ): void {
    this[field].set(value);
  }

  validateLoginBlur(field: 'email' | 'password'): void {
    if (field === 'email') {
      const value = this.loginEmail().trim();
      this.setFieldError('loginEmailErr', !value ? 'Email is required' : !this.isEmail(value) ? 'Enter a valid email' : '');
      return;
    }
    const value = this.loginPassword().trim();
    this.setFieldError('loginPassErr', !value ? 'Password is required' : '');
  }

  validateSignupBlur(field: 'name' | 'email' | 'password' | 'mobile'): void {
    if (field === 'name') {
      const value = this.signupName().trim();
      this.setFieldError('signupNameErr', !value ? 'Full name is required' : '');
      return;
    }
    if (field === 'email') {
      const value = this.signupEmail().trim();
      this.setFieldError('signupEmailErr', !value ? 'Email is required' : !this.isEmail(value) ? 'Enter a valid email' : '');
      return;
    }
    if (field === 'password') {
      const value = this.signupPassword().trim();
      this.setFieldError('signupPassErr', !value ? 'Password is required' : value.length < 6 ? 'Minimum 6 characters' : '');
      return;
    }
    const value = this.signupMobile().trim();
    this.setFieldError('signupMobileErr', !value ? 'Mobile number is required' : !this.isMobile(value) ? 'Enter a valid 10-digit number' : '');
  }

  async onLogin(): Promise<void> {
    const email = this.loginEmail().trim();
    const password = this.loginPassword();
    let ok = true;

    if (!email) {
      this.loginEmailErr.set('Email is required');
      ok = false;
    } else if (!this.isEmail(email)) {
      this.loginEmailErr.set('Enter a valid email');
      ok = false;
    } else {
      this.loginEmailErr.set('');
    }

    if (!password) {
      this.loginPassErr.set('Password is required');
      ok = false;
    } else {
      this.loginPassErr.set('');
    }

    if (!ok) return;

    this.loginLoading.set(true);
    try {
      const user = await this.api.findUserByEmail(email);

      if (!user || user.password !== password) {
        this.toast.show('Invalid email or password', 'error');
        this.loginPassErr.set('Incorrect credentials');
        return;
      }

      this.auth.storeSessionUser(user);
      this.toast.show(`Welcome back, ${user.name}! 🎉`, 'success');

      setTimeout(() => {
        this.router.navigate(['/calculator']);
      }, 1000);
    } catch {
      this.toast.show('Server error. Check if backend is running.', 'error');
    } finally {
      this.loginLoading.set(false);
    }
  }

  async onSignup(): Promise<void> {
    const name = this.signupName().trim();
    const email = this.signupEmail().trim();
    const password = this.signupPassword();
    const mobile = this.signupMobile().trim();
    let ok = true;

    if (!name) {
      this.signupNameErr.set('Full name is required');
      ok = false;
    } else {
      this.signupNameErr.set('');
    }

    if (!email) {
      this.signupEmailErr.set('Email is required');
      ok = false;
    } else if (!this.isEmail(email)) {
      this.signupEmailErr.set('Enter a valid email');
      ok = false;
    } else {
      this.signupEmailErr.set('');
    }

    if (!password) {
      this.signupPassErr.set('Password is required');
      ok = false;
    } else if (password.length < 6) {
      this.signupPassErr.set('Minimum 6 characters');
      ok = false;
    } else {
      this.signupPassErr.set('');
    }

    if (!mobile) {
      this.signupMobileErr.set('Mobile number is required');
      ok = false;
    } else if (!this.isMobile(mobile)) {
      this.signupMobileErr.set('Enter a valid 10-digit number');
      ok = false;
    } else {
      this.signupMobileErr.set('');
    }

    if (!ok) return;

    this.signupLoading.set(true);
    try {
      const existing = await this.api.findUserByEmail(email);

      if (existing) {
        this.signupEmailErr.set('This email is already registered');
        return;
      }

      const newUser = await this.api.createUser({
        name,
        email,
        password,
        mobile
      });

      this.auth.storeSessionUser(newUser);
      this.toast.show(`Account created! Welcome, ${newUser.name} 🎉`, 'success');

      setTimeout(() => {
        this.router.navigate(['/calculator']);
      }, 1200);
    } catch {
      this.toast.show('Server error. Check if backend is running.', 'error');
    } finally {
      this.signupLoading.set(false);
    }
  }
}