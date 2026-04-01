import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    return await firstValueFrom(
      this.http.get<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders()
      })
    );
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    return await firstValueFrom(
      this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders()
      })
    );
  }

  async put<T>(endpoint: string, body: any): Promise<T> {
    return await firstValueFrom(
      this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
        headers: this.getHeaders()
      })
    );
  }

  async delete<T>(endpoint: string): Promise<T> {
    return await firstValueFrom(
      this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders()
      })
    );
  }

  async findUserByEmail(email: string): Promise<any | null> {
  try {
    return await this.get<any>(`/api/v1/users/email/${encodeURIComponent(email)}`);
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

async createUser(user: any): Promise<any> {
  return await this.post<any>('/api/v1/users', user);
}
}