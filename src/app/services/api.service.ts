import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { AppData } from '../models/types';
import { INITIAL_DATA } from '../models/constants';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly BASE_URL = environment.apiUrl || 'http://localhost:5000/api';
  private readonly LOCAL_STORAGE_KEY = 'safesmart_local_data';
  private readonly AUTH_KEY = 'safesmart_admin_token';

  token = signal<string | null>(localStorage.getItem(this.AUTH_KEY));

  constructor(private http: HttpClient) { }

  private getLocalData(env: 'staging' | 'production'): AppData | null {
    try {
      const stored = localStorage.getItem(`${this.LOCAL_STORAGE_KEY}_${env}`);
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }

  private setLocalData(env: 'staging' | 'production', data: AppData) {
    try {
      localStorage.setItem(`${this.LOCAL_STORAGE_KEY}_${env}`, JSON.stringify(data));
    } catch (e) {
      console.error('Local storage full or disabled', e);
    }
  }

  private getAuthHeaders() {
    return {
      headers: {
        'Authorization': `Bearer Token ${this.token()}`
      }
    };
  }

  private isDataHealthy(data: AppData | null): boolean {
    if (!data) return false;
    // Check for essential structural elements
    if (!data.content || !data.content.home || !data.content.home.hero) return false;
    // Ensure we have some content categories even if products are empty
    if (!Array.isArray(data.categories) || data.categories.length === 0) return false;
    return true;
  }

  async getSiteData(env: 'staging' | 'production'): Promise<AppData> {
    const local = this.getLocalData(env);

    // If local data exists but is unhealthy, clear it
    if (local && !this.isDataHealthy(local)) {
      console.warn(`Unhealthy local data detected for ${env}, purging.`);
      localStorage.removeItem(`${this.LOCAL_STORAGE_KEY}_${env}`);
    }

    // [CACHE BUSTER] Force clear if old WhatsApp number is detected in local storage
    if (local?.content?.contact?.whatsapp === '919909915595') {
      console.warn('Stale WhatsApp number detected in local storage. Purging cache for update.');
      localStorage.removeItem(`${this.LOCAL_STORAGE_KEY}_${env}`);
    }

    try {
      const data = await firstValueFrom(this.http.get<AppData>(`${this.BASE_URL}/site-data/${env}`));
      if (this.isDataHealthy(data)) {
        this.setLocalData(env, data);
        return data;
      } else {
        console.warn(`Backend returned unhealthy data for ${env}, ignoring.`);
      }
    } catch (err) {
      console.warn(`Backend fetch failed for ${env}, using local manifest or constants.`);
    }

    return (local && this.isDataHealthy(local)) ? local : INITIAL_DATA;
  }

  async savePreview(data: AppData): Promise<boolean> {
    if (!this.isDataHealthy(data)) {
      console.error('Refusing to save unhealthy data payload.');
      return false;
    }

    this.setLocalData('staging', data);

    try {
      await firstValueFrom(this.http.post(`${this.BASE_URL}/save-preview`, { data }, this.getAuthHeaders()));
      return true;
    } catch (err) {
      console.error('Backend save failed.', err);
      return false;
    }
  }

  async deploy(): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BASE_URL}/deploy`, {}, this.getAuthHeaders()));
      const stagingData = this.getLocalData('staging');
      if (stagingData) {
        this.setLocalData('production', stagingData);
      }
      return true;
    } catch (err) {
      console.error('Backend deploy failed.', err);
      return false;
    }
  }

  // --- Auth & Admin Methods ---

  async login(username: string, password: string): Promise<any> {
    const result = await firstValueFrom(this.http.post<any>(`${this.BASE_URL}/login`, { username, password }));
    if (result.token) {
      this.token.set(result.token);
      localStorage.setItem(this.AUTH_KEY, result.token);
    }
    return result;
  }

  logout() {
    this.token.set(null);
    localStorage.removeItem(this.AUTH_KEY);
  }

  getAdminProfile(): Observable<any> {
    return this.http.get<any>(`${this.BASE_URL}/admin/profile`, this.getAuthHeaders());
  }

  updateAdminProfile(data: any): Observable<any> {
    return this.http.put<any>(`${this.BASE_URL}/admin/profile`, data, this.getAuthHeaders());
  }

  getAllAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/admin/manage`, this.getAuthHeaders());
  }

  createAdmin(data: any): Observable<any> {
    return this.http.post<any>(`${this.BASE_URL}/admin/manage`, data, this.getAuthHeaders());
  }

  updateAdmin(id: string, data: any): Observable<any> {
    return this.http.put<any>(`${this.BASE_URL}/admin/manage/${id}`, data, this.getAuthHeaders());
  }

  deleteAdmin(id: string): Observable<any> {
    return this.http.delete<any>(`${this.BASE_URL}/admin/manage/${id}`, this.getAuthHeaders());
  }

  async uploadImage(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await firstValueFrom(this.http.post<{ url: string }>(`${this.BASE_URL.replace('/api', '')}/api/upload-image`, formData, this.getAuthHeaders()));
      return result.url;
    } catch (err) {
      console.error('Image upload failed', err);
      return null;
    }
  }

  async sendContactMessage(data: { name: string; email: string; phone?: string; subject?: string; message: string }): Promise<boolean> {
    try {
      await firstValueFrom(this.http.post(`${this.BASE_URL}/contact`, data));
      return true;
    } catch (err) {
      console.error('Failed to send contact message', err);
      return false;
    }
  }

  // --- Inquiries ---

  getInquiries(): Observable<any[]> {
    return this.http.get<any[]>(`${this.BASE_URL}/inquiries`, this.getAuthHeaders());
  }

  updateInquiryStatus(id: string, status: string): Observable<any> {
    return this.http.patch(`${this.BASE_URL}/inquiries/${id}`, { status }, this.getAuthHeaders());
  }

  deleteInquiry(id: string): Observable<any> {
    return this.http.delete(`${this.BASE_URL}/inquiries/${id}`, this.getAuthHeaders());
  }

  batchInquiryOperation(ids: string[], operation: 'delete' | 'updateStatus', status?: string): Observable<any> {
    return this.http.post(`${this.BASE_URL}/inquiries/batch`, { ids, operation, status }, this.getAuthHeaders());
  }
}
