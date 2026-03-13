
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Product } from '../../models/types';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, SafeUrlPipe],
  template: `
    <div class="animate-fade-in bg-white min-h-screen font-sans">
      @if (product()) {
        <section class="relative bg-brand-darkest py-20 text-center text-white overflow-hidden">
          <div class="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1920')] bg-cover bg-fixed"></div>
          <div class="container mx-auto px-6 relative z-10">
            <h1 class="text-3xl md:text-5xl font-black uppercase tracking-tight leading-tight drop-shadow-lg italic">
              {{ product()?.name }}
            </h1>
          </div>
        </section>

        <div class="bg-gray-50 border-b border-gray-200">
          <div class="container mx-auto px-6 py-4 text-[10px] uppercase font-bold tracking-widest text-gray-500">
            <a routerLink="/" class="hover:text-brand-primary">Home</a>
            <span class="mx-3 text-gray-300">/</span>
            <a [routerLink]="['/category', slugify(product()!.category)]" class="hover:text-brand-primary">{{ product()?.category }}</a>
            <span class="mx-3 text-gray-300">/</span>
            <span class="text-brand-darkest">{{ product()?.name }}</span>
          </div>
        </div>

        <section class="py-20 bg-white">
          <div class="container mx-auto px-6">
            <div class="flex flex-col lg:flex-row gap-20 items-start">
              <div class="w-full lg:w-1/2">
                <div class="rounded-[40px] overflow-hidden shadow-2xl bg-white border border-gray-100 p-3 flex justify-center items-center h-[400px] md:h-[600px]">
                  <img [src]="product()?.image" [alt]="product()?.name" class="w-full h-full object-contain rounded-[32px]" />
                </div>
              </div>

              <div class="w-full lg:w-1/2">
                <div class="prose prose-lg text-gray-800 leading-relaxed mb-10">
                  <span class="text-brand-primary font-black uppercase tracking-[0.3em] text-[10px] block mb-4">Industrial Grade Protection</span>
                  <p class="text-2xl font-bold text-brand-darkest mb-6 leading-snug">{{ product()?.description }}</p>
                  <div class="whitespace-pre-line text-base text-gray-600 border-l-4 border-brand-lightest pl-6 py-2 italic font-medium">
                    {{ product()?.longDescription || "Engineered for high-security environments, this unit features unbreakable build quality." }}
                  </div>
                </div>
                
                <div class="flex flex-wrap items-center gap-4 text-xs font-black uppercase tracking-widest text-brand-darkest">
                  @for (f of product()?.features; track f) {
                    <span class="bg-brand-primary/10 px-4 py-2 rounded-lg">{{ f }}</span>
                  }
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Variants Comparison Section -->
        <section class="py-24 bg-gray-50">
          <div class="container mx-auto px-6">
            <h2 class="text-3xl md:text-5xl font-black text-brand-darkest uppercase italic mb-16 tracking-tighter text-center">Engineered Variations</h2>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
              <!-- Defender Variant -->
              <div class="flex flex-col">
                <div class="bg-brand-darkest p-8 md:p-12 rounded-[48px] shadow-2xl text-white mb-10 flex-grow">
                  <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white">
                      <i class="fas fa-shield-alt text-xl"></i>
                    </div>
                    <div>
                      <h3 class="text-2xl font-black uppercase italic tracking-tighter text-brand-primary">Defender</h3>
                      <p class="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Standard Excellence</p>
                    </div>
                  </div>

                  <!-- Defender Specs First -->
                  <div class="space-y-6 mb-12">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-brand-primary/60 border-b border-white/10 pb-2">Technical Specifications</h4>
                    @for (s of (product()?.defenderSpecs || product()?.specifications); track s.label) {
                      <div class="flex justify-between items-center border-b border-white/5 pb-4">
                        <span class="text-[9px] font-black uppercase tracking-widest text-gray-400">{{ s.label }}</span>
                        <span class="text-xs font-bold italic">{{ s.value }}</span>
                      </div>
                    }
                  </div>

                  <!-- Defender Features Second -->
                  <div class="space-y-4">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-brand-primary/60 border-b border-white/10 pb-2">Armor Features</h4>
                    <ul class="space-y-4">
                      @for (tf of (product()?.defenderFeatures || product()?.technicalFeatures); track tf) {
                        <li class="flex gap-4 items-start group">
                          <div class="w-5 h-5 rounded-lg bg-brand-primary/20 text-brand-primary flex items-center justify-center flex-shrink-0 mt-1">
                            <i class="fas fa-check text-[9px]"></i>
                          </div>
                          <span class="text-gray-300 font-bold text-xs leading-relaxed">{{ tf }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              </div>

              <!-- Defender+ Variant -->
              <div class="flex flex-col">
                <div class="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl text-brand-darkest mb-10 border border-gray-100 flex-grow">
                  <div class="flex items-center gap-4 mb-8">
                    <div class="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                      <i class="fas fa-shield-virus text-xl"></i>
                    </div>
                    <div>
                      <h3 class="text-2xl font-black uppercase italic tracking-tighter text-brand-darkest">Defender+</h3>
                      <p class="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary">Ultimate Protection</p>
                    </div>
                  </div>

                  <!-- Defender+ Specs First -->
                  <div class="space-y-6 mb-12">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-gray-100 pb-2">Technical Specifications</h4>
                    @for (s of (product()?.defenderPlusSpecs || product()?.specifications); track s.label) {
                      <div class="flex justify-between items-center border-b border-gray-50 pb-4">
                        <span class="text-[9px] font-black uppercase tracking-widest text-gray-400">{{ s.label }}</span>
                        <span class="text-xs font-bold italic">{{ s.value }}</span>
                      </div>
                    }
                  </div>

                  <!-- Defender+ Features Second -->
                  <div class="space-y-4">
                    <h4 class="text-[10px] font-black uppercase tracking-widest text-brand-primary border-b border-gray-100 pb-2">Elite Armor Features</h4>
                    <ul class="space-y-4">
                      @for (tf of (product()?.defenderPlusFeatures || product()?.technicalFeatures); track tf) {
                        <li class="flex gap-4 items-start group">
                          <div class="w-5 h-5 rounded-lg bg-brand-primary text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-brand-primary/20">
                            <i class="fas fa-plus text-[9px]"></i>
                          </div>
                          <span class="text-gray-600 font-bold text-xs leading-relaxed">{{ tf }}</span>
                        </li>
                      }
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Video Content -->
        @if (product()?.videoUrl) {
          <section class="py-24 bg-white">
            <div class="container mx-auto px-6">
               <div class="max-w-4xl mx-auto">
                 <h2 class="text-center text-4xl font-black text-brand-darkest uppercase italic mb-16">Demonstration Unit</h2>
                 <div class="aspect-video rounded-[48px] overflow-hidden shadow-3xl border-8 border-gray-100 bg-brand-darkest">
                    <iframe [src]="product()?.videoUrl! | safeUrl" class="w-full h-full" allowfullscreen></iframe>
                 </div>
               </div>
            </div>
          </section>
        }
      }
    </div>
  `,
  styles: []
})
export class ProductDetailComponent implements OnInit {
  productId = signal<string | null>(null);

  product = computed(() => {
    const id = this.productId();
    if (!id) return null;
    return this.dataService.getProducts().find(p => p.id === id) || null;
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.productId.set(id);
        const p = this.dataService.getProducts().find(prod => prod.id === id);
        if (!p) {
          this.router.navigate(['/category', 'all']);
        }
      }
    });
  }

  slugify(text: string): string {
    return text.replace(/\s+/g, '-').toLowerCase();
  }
}
