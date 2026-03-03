import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { DataService } from '../../services/data.service';
import { CommonContactFormComponent } from '../common-contact-form/common-contact-form.component';

@Component({
  selector: 'app-contact-us',
  standalone: true,
  imports: [CommonModule, CommonContactFormComponent],
  template: `
    <div class="animate-fade-in bg-white min-h-screen">
      <section class="bg-brand-darkest py-20 text-white text-center relative overflow-hidden">
        <div class="absolute inset-0 opacity-5 yogi-pattern pointer-events-none"></div>
        <div class="container mx-auto px-4 relative z-10">
          <h1 class="text-5xl font-black uppercase italic mb-4">Secure Channel</h1>
          <p class="text-brand-lightest uppercase tracking-widest text-xs">Direct Access to Our Security Experts</p>
        </div>
      </section>

      <section class="py-24">
        <div class="container mx-auto px-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 items-start mb-24">
            <div>
              <h2 class="text-3xl font-black text-brand-darkest uppercase italic mb-8">Strategic Locations</h2>
              <div class="space-y-8 mb-12">
                <a [href]="addressUrl()" target="_blank" rel="noopener noreferrer" class="flex gap-6 items-start group hover:translate-x-2 transition-transform duration-200">
                  <div class="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg group-hover:scale-110 transition-transform">
                    <i class="fas fa-map-marked-alt text-xl"></i>
                  </div>
                  <div class="space-y-1">
                    <h4 class="font-bold text-brand-darkest uppercase text-sm mb-1 tracking-widest group-hover:text-brand-primary transition">Corporate HQ</h4>
                    <p class="text-gray-500 text-sm font-bold leading-relaxed">{{ contact().address }}</p>
                  </div>
                </a>
                <div class="flex gap-6 items-start group transition-all duration-300">
                  <div class="w-12 h-12 bg-gradient-to-br from-brand-primary to-brand-dark rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-xl group-hover:scale-110 transition-transform">
                    <i class="fas fa-phone-alt text-xl"></i>
                  </div>
                  <div class="space-y-2">
                    <h4 class="font-bold text-brand-darkest uppercase text-sm mb-1 tracking-widest transition">Response Protocols</h4>
                    <a [href]="'tel:' + (contact().phone.replace(' ', '') || '')" class="text-gray-500 hover:text-brand-primary text-sm font-bold leading-relaxed block transition-colors">Line 01: {{ contact().phone }}</a>
                    @if (contact().phone2; as p2) {
                      <a [href]="'tel:' + (p2.replace(' ', '') || '')" class="text-gray-500 hover:text-brand-primary text-sm font-bold leading-relaxed block transition-colors">Line 02: {{ p2 }}</a>
                    }
                    <div class="inline-flex items-center gap-2 px-3 py-1 bg-green-50 rounded-full border border-green-100">
                      <div class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                      <span class="text-[10px] text-green-600 font-black uppercase tracking-widest">Active Secure Line</span>
                    </div>
                  </div>
                </div>
                <a [href]="mailUrl()" class="flex gap-6 items-start group hover:translate-x-2 transition-transform duration-200">
                  <div class="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-lg group-hover:scale-110 transition-transform">
                    <i class="fas fa-envelope-open-text text-xl"></i>
                  </div>
                  <div class="space-y-1">
                    <h4 class="font-bold text-brand-darkest uppercase text-sm mb-1 tracking-widest group-hover:text-brand-primary transition">Encryption Mail</h4>
                    <p class="text-gray-500 text-sm font-bold leading-relaxed">{{ contact().email }}</p>
                  </div>
                </a>
              </div>
            </div>

            <div class="rounded-[48px] overflow-hidden shadow-2xl h-[500px] border-8 border-gray-50 bg-gray-100 sticky top-32">
              <iframe 
                [src]="safeMapUrl()"
                class="w-full h-full grayscale hover:grayscale-0 transition duration-1000"
                style="border: 0" 
                allowfullscreen="true" 
                loading="lazy"
                title="Secure Location Mapping"
              ></iframe>
            </div>
          </div>

          <div class="bg-gray-50 py-24 rounded-[64px]">
             <app-common-contact-form></app-common-contact-form>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class ContactUsComponent {
  private sanitizer = inject(DomSanitizer);
  private dataService = inject(DataService);

  contact = computed(() => this.dataService.getAppData().content.contact);

  addressUrl = computed(() => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.contact().address)}`);
  phoneUrl = computed(() => `tel:${this.contact().phone.replace(/\s+/g, '')}`);
  mailUrl = computed(() => `mailto:${this.contact().email}`);
  safeMapUrl = computed(() => this.sanitizer.bypassSecurityTrustResourceUrl(this.contact().mapEmbed));

  constructor() { }
}
