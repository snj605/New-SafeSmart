
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-switcher',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-8 right-8 z-[200]">
      @if (isOpen()) {
        <div class="bg-white p-4 rounded-2xl shadow-2xl border border-gray-100 mb-4 animate-scale-in flex flex-col gap-2 min-w-[200px] absolute bottom-full right-0">
          <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Select Color Palette</p>
          @for (t of themes; track t.id) {
            <button
              (click)="applyTheme(t.id)"
              [class]="'flex items-center gap-3 w-full px-4 py-3 rounded-xl text-xs font-bold transition-all ' + (activeTheme() === t.id ? 'bg-gray-100 text-brand-darkest' : 'hover:bg-gray-50 text-gray-500')"
            >
              <span class="w-4 h-4 rounded-full border border-gray-200" [style.backgroundColor]="t.color"></span>
              {{ t.label }}
              @if (activeTheme() === t.id) {
                <i class="fas fa-check ml-auto text-brand-primary"></i>
              }
            </button>
          }
        </div>
      }
      
      <button
        (click)="isOpen.set(!isOpen())"
        class="w-14 h-14 bg-white border border-gray-200 shadow-2xl rounded-2xl flex items-center justify-center text-brand-darkest hover:bg-gray-50 transition active:scale-90"
        title="Change Theme"
      >
        <i [class]="'fas ' + (isOpen() ? 'fa-times' : 'fa-palette') + ' text-xl'"></i>
      </button>
    </div>
  `,
  styles: [`
    @keyframes scale-in {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-scale-in { animation: scale-in 0.2s ease-out; }
  `]
})
export class ThemeSwitcherComponent implements OnInit {
  isOpen = signal(false);
  activeTheme = signal('theme-current');

  themes = [
    { id: 'theme-current', label: 'Current Deep Blue', color: '#011f4b' },
    { id: 'theme-dark', label: 'Stealth Dark', color: '#0a0a0a' },
    { id: 'theme-bluish', label: 'Vibrant Bluish', color: '#2563eb' }
  ];

  ngOnInit() {
    const savedTheme = localStorage.getItem('safesmart-theme') || 'theme-current';
    this.applyTheme(savedTheme);
  }

  applyTheme(theme: string) {
    document.documentElement.className = theme;
    this.activeTheme.set(theme);
    localStorage.setItem('safesmart-theme', theme);
  }
}
