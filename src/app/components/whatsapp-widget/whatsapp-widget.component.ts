import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-whatsapp-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <a
      [href]="whatsappUrl()"
      target="_blank"
      class="fixed bottom-8 left-8 z-[100] group flex items-center gap-3 flex-row no-underline"
      aria-label="Chat on WhatsApp"
    >
      <div class="relative">
        <div class="w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl transition transform hover:scale-110 active:scale-95 animate-pulse-slow">
          <i class="fab fa-whatsapp text-3xl"></i>
        </div>
        <!-- Online Indicator -->
        <span class="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
        <span class="absolute top-0 right-0 w-4 h-4 bg-red-500 border-2 border-white rounded-full"></span>
      </div>
      <div class="flex flex-col items-start translate-x-[-10px] group-hover:translate-x-0 transition-all opacity-0 group-hover:opacity-100 hidden md:flex">
        <span class="bg-brand-darkest text-white text-[9px] font-black uppercase tracking-[0.2em] px-4 py-2 rounded-xl shadow-2xl border border-white/10 mb-1">
          Officer Online
        </span>
        <span class="text-[8px] font-black text-brand-darkest uppercase tracking-widest bg-white/80 backdrop-blur-md px-3 py-1 rounded-lg shadow-sm border border-gray-100">
          Response: <span class="text-green-600">Instantly</span>
        </span>
      </div>
    </a>
  `,
  styles: [`
    @keyframes pulse-slow {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.05); opacity: 0.9; }
    }
    .animate-pulse-slow {
      animation: pulse-slow 3s infinite ease-in-out;
    }
  `]
})
export class WhatsAppWidgetComponent {
  @Input({ required: true }) number!: string;
  @Input() message: string = "";

  whatsappUrl = computed(() => {
    const cleanNumber = (this.number || '919664838705').replace(/\D/g, '');
    const text = this.message || "Hello SafeSmart Security Team, I'm interested in your high-security products. Can you please assist me with more information?";
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
  });
}
