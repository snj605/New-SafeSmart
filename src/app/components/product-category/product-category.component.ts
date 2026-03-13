
import { Component, OnInit, signal, computed, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { Product, Category } from '../../models/types';

@Component({
  selector: 'app-product-category',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in bg-white min-h-screen">
      <section class="bg-brand-darkest py-24 text-white relative overflow-hidden">
        <div class="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1920')] bg-cover bg-fixed"></div>
        <div class="container mx-auto px-6 relative z-10 text-center">
          <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[8px] md:text-[10px] mb-4 block">Manufacturing Excellence</span>
          <h1 class="text-3xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">{{ categoryName() }}</h1>
          <p class="text-brand-lightest text-sm uppercase tracking-widest max-w-2xl mx-auto italic font-light">
            Engineered for high-value asset protection. Our {{ categoryName() }} range meets global industry standards.
          </p>
        </div>
      </section>

      <section class="py-24">
        <div class="container mx-auto px-6">
          @if (filteredProducts().length === 0) {
            <div class="text-center py-20 text-gray-300">
              <i class="fas fa-box-open text-8xl mb-6"></i>
              <p class="text-2xl font-bold uppercase tracking-widest">No matching security units</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
              @for (product of filteredProducts(); track product.id) {
                <a 
                  #productCard
                  [attr.data-id]="product.id"
                  [routerLink]="['/product', product.id]"
                  class="group relative h-[550px] rounded-[48px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 border border-gray-100 flex flex-col justify-end p-6 hover:-translate-y-2 bg-white"
                >
                  <!-- Background Asset Layer -->
                  <div class="absolute inset-0 z-0 bg-white">
                    <img [src]="product.image" [alt]="product.name"
                         class="w-full h-full object-contain transition-all duration-700 ease-out group-hover:scale-105"
                         [class.opacity-100]="activeProductId() === product.id"
                         [class.opacity-60]="activeProductId() !== product.id"
                         [class.lg:opacity-100]="true"
                    />
                    <!-- Dynamic Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-brand-darkest/40 via-transparent to-transparent opacity-60 group-hover:opacity-20 transition-opacity"></div>
                  </div>

                  <!-- Tag Entity -->
                  <div class="absolute top-8 left-8 z-20 bg-brand-primary text-white text-[9px] px-5 py-2 rounded-full font-black uppercase tracking-[0.2em] shadow-xl backdrop-blur-sm bg-opacity-90">
                    {{ product.category }}
                  </div>

                  <!-- Glass Intelligence Card -->
                  <div class="relative z-10 glass p-8 md:p-10 rounded-[36px] flex flex-col transition-all duration-500 group-hover:mb-2 translate-y-2 group-hover:translate-y-0">
                    <h3 class="text-xl font-black text-brand-darkest mb-3 uppercase tracking-tight group-hover:text-brand-primary transition leading-none italic">{{ product.name }}</h3>
                    <p class="text-[11px] text-slate-600 mb-8 line-clamp-2 leading-relaxed italic opacity-80 group-hover:opacity-100 transition">{{ product.description }}</p>

                    <div class="flex items-center justify-between pt-6 border-t border-slate-400/10">
                      <div>
                        <span class="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Asset Value</span>
                        <span class="text-lg font-black text-brand-darkest tracking-tight">{{ product.price }}</span>
                      </div>
                      <div class="w-12 h-12 rounded-2xl bg-brand-darkest group-hover:bg-brand-primary text-white flex items-center justify-center transition shadow-lg group-hover:shadow-brand-primary/30">
                        <i class="fas fa-arrow-right text-xs"></i>
                      </div>
                    </div>
                  </div>
                </a>
              }
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class ProductCategoryComponent implements OnInit, AfterViewInit, OnDestroy {
  categorySlug = signal<string>('all');
  
  @ViewChildren('productCard') productCards!: QueryList<ElementRef>;
  activeProductId = signal<string | null>(null);
  private observer: IntersectionObserver | null = null;

  filteredProducts = computed(() => {
    const slug = this.categorySlug();
    const allProducts = this.dataService.getProducts();
    
    if (slug === 'all') return allProducts;
    
    return allProducts.filter(p => this.slugify(p.category) === slug);
  });

  categoryName = computed(() => {
    const slug = this.categorySlug();
    if (slug === 'all') return 'All Security Assets';
    
    const cat = this.dataService.getCategories().find(c => this.slugify(c.name) === slug);
    return cat ? cat.name : 'Products';
  });

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const cat = params.get('id');
      if (cat) {
        this.categorySlug.set(cat);
      }
    });
  }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }

  private setupIntersectionObserver() {
    if (typeof window === 'undefined') return;

    const options = {
      root: null,
      rootMargin: '-20% 0px -20% 0px',
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          this.activeProductId.set(id);
        }
      });
    }, options);

    this.productCards.changes.subscribe(() => {
      this.productCards.forEach(card => this.observer?.observe(card.nativeElement));
    });

    this.productCards.forEach(card => this.observer?.observe(card.nativeElement));

    // Default to first product if available
    const products = this.filteredProducts();
    if (products.length > 0) this.activeProductId.set(products[0].id);
  }

  private slugify(text: string): string {
    return text.replace(/\s+/g, '-').toLowerCase();
  }
}
