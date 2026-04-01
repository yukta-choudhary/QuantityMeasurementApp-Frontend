import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SessionUser, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'quanment_user';

  constructor(private router: Router) {}

  getSessionUser(): SessionUser | null {
    const raw = sessionStorage.getItem(this.storageKey);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as SessionUser;
    } catch {
      return null;
    }
  }

  isLoggedIn(): boolean {
    return this.getSessionUser() !== null;
  }

  storeSessionUser(user: Pick<User, 'id' | 'name' | 'email'>): void {
    if (user.id == null) return;
    sessionStorage.setItem(
      this.storageKey,
      JSON.stringify({ id: user.id, name: user.name, email: user.email } satisfies SessionUser)
    );
  }

  logout(): void {
    sessionStorage.removeItem(this.storageKey);
    void this.router.navigate(['/login']);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  getFirstName(name: string): string {
    return name.split(' ').filter(Boolean)[0] ?? '';
  }
}
