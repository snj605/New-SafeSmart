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
      <div class="w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-2xl transition transform hover:scale-110 active:scale-95 animate-pulse-slow">
        <i class="fab fa-whatsapp text-3xl"></i>
      </div>
      <span class="bg-white text-brand-darkest text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity hidden md:block border border-gray-100">
        Secure Support Available
      </span>
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
