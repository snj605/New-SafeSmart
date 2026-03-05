
import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AppData } from '../models/types';
import { INITIAL_DATA } from '../models/constants';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly BASE_URL = environment.apiUrl || 'http://localhost:5000/api';
  private readonly LOCAL_STORAGE_KEY = 'safesmart_local_data';

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

    // Always keep local storage in sync for the current browser session
    this.setLocalData('staging', data);

    try {
      await firstValueFrom(this.http.post(`${this.BASE_URL}/save-preview`, { data }));
      return true;
    } catch (err) {
      console.error('Backend save failed. Changes are local to this browser only.', err);
      // We throw or return false so the UI knows the Cloud Sync failed
      return false;
    }
  }

  async deploy(): Promise<boolean> {
    try {
      // 1. Tell server to copy staging record to production record in MongoDB
      await firstValueFrom(this.http.post(`${this.BASE_URL}/deploy`, {}));

      // 2. If server succeeded, sync local production cache too
      const stagingData = this.getLocalData('staging');
      if (stagingData) {
        this.setLocalData('production', stagingData);
      }
      return true;
    } catch (err) {
      console.error('Backend deploy failed. Production site was NOT updated.', err);
      return false;
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

  async uploadImage(file: File): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const result = await firstValueFrom(this.http.post<{ url: string }>(`${this.BASE_URL.replace('/api', '')}/api/upload-image`, formData));
      return result.url;
    } catch (err) {
      console.error('Image upload failed', err);
      return null;
    }
  }
}
