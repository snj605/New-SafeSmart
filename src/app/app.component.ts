import { Component, OnInit, signal, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DataService } from './services/data.service';
import { ApiService } from './services/api.service';
import { WhatsAppWidgetComponent } from './components/whatsapp-widget/whatsapp-widget.component';
import { ThemeSwitcherComponent } from './components/theme-switcher/theme-switcher.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, WhatsAppWidgetComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  loading = signal(true);
  secondaryLoading = signal(false);
  viewMode = signal<'production' | 'staging'>(
    (localStorage.getItem('safesmart_view_mode') as 'production' | 'staging') || 'production'
  );

  isDropdownOpen = signal(false);
  isMobileMenuOpen = signal(false);
  isMobileProductsOpen = signal(false);

  appData = computed(() => this.dataService.getAppData());
  categories = computed(() => this.dataService.getCategories());
  logoPath = "/assets/images/safe-smart-logo-temp.png";

  constructor(
    private dataService: DataService,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.fetchData(true);
  }

  async fetchData(isFirstTime: boolean = false) {
    if (isFirstTime) {
      this.loading.set(true);
    } else {
      this.secondaryLoading.set(true);
      this.dataService.setSecondaryLoading(true);
    }

    try {
      const data = await this.apiService.getSiteData(this.viewMode());
      this.dataService.updateAppData(data);
    } catch (err) {
      console.error('Data fetch failed', err);
    } finally {
      this.loading.set(false);
      this.secondaryLoading.set(false);
      this.dataService.setSecondaryLoading(false);
    }
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(v => !v);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
    this.isMobileProductsOpen.set(false);
  }

  toggleMobileProducts() {
    this.isMobileProductsOpen.update(v => !v);
  }

  handleSetViewMode(mode: 'production' | 'staging') {
    this.viewMode.set(mode);
    localStorage.setItem('safesmart_view_mode', mode);
    this.fetchData(false);
  }

  slugify(text: string): string {
    return text.replace(/\s+/g, '-').toLowerCase();
  }
}
