import { Injectable, signal, computed } from '@angular/core';
import { AppData, Product, BlogPost, Category, SiteContent } from '../models/types';
import { INITIAL_DATA } from '../models/constants';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  // Use a signal for core application state
  private _appData = signal<AppData>(INITIAL_DATA);

  // Public signal for components to track
  appData = computed(() => this._appData());

  // State for secondary loading (skeleton UI)
  isSecondaryLoading = signal(false);

  constructor() { }

  getAppData(): AppData {
    return this._appData();
  }

  updateAppData(newData: AppData) {
    this._appData.set(newData);
  }

  setSecondaryLoading(loading: boolean) {
    this.isSecondaryLoading.set(loading);
  }

  getProducts(): Product[] {
    return this._appData().products;
  }

  getBlogs(): BlogPost[] {
    return this._appData().blogs;
  }

  getCategories(): Category[] {
    return this._appData().categories;
  }

  getContent(): SiteContent {
    return this._appData().content;
  }

  getProductById(id: string): Product | undefined {
    return this._appData().products.find(p => p.id === id);
  }

  getBlogBySlug(slug: string): BlogPost | undefined {
    return this._appData().blogs.find(b => b.slug === slug);
  }

  getProductsByCategory(categoryName: string): Product[] {
    return this._appData().products.filter(p => p.category === categoryName);
  }
}
