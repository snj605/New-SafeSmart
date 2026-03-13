
import { Component, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-about-us',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in bg-brand-body text-brand-mainText font-sans">
      <!-- Cinematic Hero Section -->
      <section class="h-[50vh] md:h-[80vh] relative overflow-hidden bg-brand-darkest">
        <div class="absolute inset-0 z-0 bg-brand-darkest">
          <img
            [src]="about().image"
            class="w-full h-full object-contain opacity-50 scale-110"
            alt="About SafeSmart"
          />
        </div>
        <div class="absolute inset-0 bg-gradient-to-t from-brand-darkest via-brand-darkest/70 to-transparent flex items-end">
          <div class="container mx-auto px-6 py-16 md:py-24">
            <div class="max-w-4xl">
              <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[9px] md:text-[10px] mb-6 block animate-reveal">
                Securing Legacies for Generations
              </span>
              <h1 class="text-3xl md:text-5xl lg:text-6xl font-black text-white uppercase italic tracking-tighter mb-8 leading-tight drop-shadow-2xl animate-reveal stagger-1">
                {{ about().heroTitle }}
              </h1>
              <p class="text-brand-lightest max-w-2xl uppercase tracking-[0.3em] text-[9px] md:text-[11px] font-bold opacity-70 leading-relaxed italic animate-reveal stagger-2">
                {{ about().heroSubtitle }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Emotional Storytelling -->
      <section class="py-24 md:py-32 bg-brand-body relative overflow-hidden">
        <div class="container mx-auto px-6">
          <div class="flex flex-col lg:flex-row gap-16 lg:gap-24 items-center">
            <div class="w-full lg:w-1/2 relative">
               <div class="absolute -top-16 -left-16 w-64 h-64 bg-brand-primary/5 rounded-full blur-[80px]"></div>
               <div class="relative z-10 group">
                    <div class="aspect-square rounded-[48px] overflow-hidden shadow-3xl border-8 border-white bg-white">
                      <img
                        [src]="about().image"
                        class="w-full h-[450px] md:h-[650px] object-contain group-hover:scale-105 transition-transform duration-[3000ms]"
                        alt="Manufacturing Excellence"
                      />
                    </div>
                  <div class="absolute inset-0 bg-brand-darkest/20 group-hover:bg-transparent transition duration-700"></div>
                  <div class="absolute -bottom-8 -right-8 md:-bottom-12 md:-right-12 bg-brand-primary text-white p-8 md:p-12 rounded-[40px] md:rounded-[56px] shadow-3xl max-w-[260px] md:max-w-[320px] transform hover:scale-105 transition duration-500">
                    <h4 class="text-3xl md:text-4xl font-black italic mb-2 tracking-tighter leading-none">Trust</h4>
                    <p class="text-[10px] md:text-[11px] font-black uppercase tracking-widest leading-relaxed opacity-90">Forged in Absolute Integrity and Human Connection</p>
                  </div>
               </div>
            </div>
            <div class="w-full lg:w-1/2">
              <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-5 md:mb-6 block">Our Heart & Soul</span>
              <h2 class="text-3xl md:text-5xl font-black text-brand-darkest mb-8 md:mb-10 uppercase italic tracking-tighter leading-tight">
                Beyond the Armor: <br/>A Promise of Peace
              </h2>
              <div class="space-y-6 md:space-y-10 text-brand-mutedText leading-relaxed italic text-base md:text-xl">
                <p>
                  At SafeSmart, we realized that the physical security industry had lost its soul. Legacy brands were selling cold steel boxes, forgetting the families, the businesses, and the dreams those boxes were meant to protect.
                </p>
                <div class="not-italic font-black text-brand-darkest border-l-8 border-brand-primary pl-8 md:pl-10 py-5 md:py-6 my-8 md:my-12 bg-brand-alt rounded-r-[32px] md:rounded-r-[40px] shadow-sm transform hover:translate-x-2 transition-transform">
                  "We don't just sell security; we sell the quiet sleep that comes from knowing your life's work is in the safest hands."
                </div>
                <p>
                  Being a newcomer means we have everything to prove. We treat every safe as if it were protecting our own family. Our legacy isn't written in old catalogs—it's written in the modern precision of every robotic weld and the radical honesty we offer every customer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- The SafeSmart Pillars -->
      <section class="py-24 md:py-32 bg-brand-alt border-y border-brand-navBorder relative overflow-hidden">
        <div class="absolute inset-0 opacity-5 yogi-pattern pointer-events-none"></div>
        <div class="container mx-auto px-6 relative z-10">
          <div class="text-center mb-16 md:mb-24">
            <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Our Foundation</span>
            <h2 class="text-3xl md:text-5xl font-black text-brand-darkest uppercase italic tracking-tighter">The Pillars of Protection</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            @for (pillar of pillars; track pillar.title) {
              <div class="bg-brand-body p-10 md:p-12 rounded-[48px] md:rounded-[56px] shadow-sm hover:shadow-2xl transition-all duration-500 group border border-transparent hover:border-brand-primary hover:-translate-y-3">
                <div class="w-16 h-16 md:w-20 md:h-20 bg-brand-darkest rounded-2xl md:rounded-3xl flex items-center justify-center text-white mb-8 md:mb-10 group-hover:bg-brand-primary transition-all duration-500 group-hover:rotate-12">
                  <i [class]="'fas fa-' + pillar.icon + ' text-2xl md:text-3xl'"></i>
                </div>
                <h4 class="text-xl md:text-2xl font-black text-brand-darkest uppercase italic mb-4 md:mb-6 tracking-tight">{{ pillar.title }}</h4>
                <p class="text-[10px] md:text-[11px] text-brand-mutedText leading-relaxed font-black uppercase tracking-widest opacity-80">{{ pillar.desc }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Legacy Manufacturing Section -->
      <section class="py-24 md:py-32 bg-brand-body">
        <div class="container mx-auto px-6">
          <div class="text-center max-w-4xl mx-auto mb-16 md:mb-24">
            <h2 class="text-3xl md:text-6xl font-black text-brand-darkest uppercase italic tracking-tighter mb-8 leading-tight">A New Era of Craftsmanship</h2>
            <p class="text-lg md:text-xl text-brand-mutedText italic leading-relaxed">
              Witness the SafeSmart difference—where aerospace-grade automation meets the heart of a protector.
            </p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
             @for (item of manufacturingGallery; track item.title; let idx = $index) {
               <div class="h-[400px] md:h-[500px] rounded-[48px] md:rounded-[64px] overflow-hidden group shadow-2xl relative" [class.md:translate-y-16]="idx === 1">
                 <div class="h-48 md:h-64 overflow-hidden relative bg-white">
                   <img [src]="item.img" class="w-full h-full object-contain group-hover:scale-110 transition duration-1000" [alt]="item.title" />
                   <div class="absolute inset-0 bg-brand-darkest/10 group-hover:bg-transparent transition duration-500"></div>
                 </div>
                 <div class="absolute inset-0 bg-gradient-to-t from-brand-darkest/80 via-transparent to-transparent flex items-end p-8 md:p-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                    <div>
                      <span class="text-brand-primary text-[9px] font-black uppercase tracking-[0.4em] mb-3 block">{{ item.tag }}</span>
                      <h5 class="text-white text-xl md:text-2xl font-black uppercase italic tracking-tighter">{{ item.title }}</h5>
                    </div>
                 </div>
               </div>
             }
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="py-32 md:py-40 bg-brand-darkest relative overflow-hidden text-white text-center border-t-[12px] md:border-t-[16px] border-brand-primary">
        <div class="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1450101499163-c8848c66ca85?q=80&w=1920')] bg-cover bg-center bg-fixed"></div>
        <div class="container mx-auto px-6 relative z-10">
          <h2 class="text-4xl md:text-7xl font-black uppercase italic tracking-tighter mb-12 md:mb-16 leading-tight">
            Protecting Your Future,<br class="hidden md:block" /> Starting Today.
          </h2>
          <div class="flex flex-wrap justify-center gap-6 md:gap-10">
            <a routerLink="/contact" class="w-full sm:w-auto bg-brand-primary text-white px-12 md:px-20 py-6 md:py-8 rounded-[24px] md:rounded-3xl font-black uppercase tracking-[0.2em] text-xs md:text-sm shadow-3xl transition hover:bg-white hover:text-brand-darkest transform hover:scale-105 active:scale-95 duration-500">
              Free Security Audit
            </a>
            <a routerLink="/category/all" class="w-full sm:w-auto bg-white/10 backdrop-blur-xl text-white border border-white/20 px-12 md:px-20 py-6 md:py-8 rounded-[24px] md:rounded-3xl font-black uppercase tracking-[0.2em] text-xs md:text-sm transition hover:bg-white/30 transform hover:scale-105 active:scale-95 duration-500">
              Browse Collection
            </a>
          </div>
          <p class="mt-12 md:mt-16 text-[10px] font-black uppercase tracking-[0.5em] text-brand-lightest opacity-60">Crafted with Trust in Gondal, Gujarat</p>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class AboutUsComponent {
  about = computed(() => this.dataService.getAppData().content.about);
  
  pillars = [
    { title: 'Modern Integrity', desc: 'No legacy baggage. We utilize only the latest 2023 BIS standards for uncompromised safety.', icon: 'shield-check' },
    { title: 'Robotic Precision', desc: 'Automated manufacturing ensures every unit is identical in its industrial strength.', icon: 'microchip' },
    { title: 'Radical Honesty', desc: 'Detailed technical data for every client. We explain the engineering—no marketing buffs.', icon: 'eye' },
    { title: 'Future Defense', desc: 'Armor that evolves with the threats. We test against the high-torque tools of tomorrow.', icon: 'vault' }
  ];

  manufacturingGallery = [
    { img: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?q=80&w=800", tag: "Standard: Perfect", title: "Robotic Fusion" },
    { img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800", tag: "Testing", title: "Material Science" },
    { img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=800", tag: "Excellence", title: "Absolute Security" }
  ];

  constructor(private dataService: DataService) {}
}
