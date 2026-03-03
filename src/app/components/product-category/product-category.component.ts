
import { Component, OnInit, signal, computed } from '@angular/core';
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
          <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Manufacturing Excellence</span>
          <h1 class="text-5xl md:text-7xl font-black uppercase italic tracking-tighter mb-6">{{ categoryName() }}</h1>
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
                  [routerLink]="['/product', product.id]"
                  class="group bg-white rounded-[40px] overflow-hidden shadow-sm hover:shadow-[0_40px_80px_-20px_rgba(1,31,75,0.15)] transition-all border border-gray-100 flex flex-col h-full hover:-translate-y-2 duration-500"
                >
                  <div class="relative h-80 overflow-hidden bg-gray-50 border-b">
                    <img [src]="product.image" [alt]="product.name" class="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    <div class="absolute top-6 left-6 bg-brand-primary text-white text-[9px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-xl">
                      {{ product.category }}
                    </div>
                  </div>
                  <div class="p-10 flex flex-col flex-grow">
                    <h3 class="text-xl font-black text-brand-darkest mb-4 uppercase tracking-tight group-hover:text-brand-primary transition">{{ product.name }}</h3>
                    <p class="text-xs text-gray-500 mb-8 line-clamp-3 leading-loose italic">{{ product.description }}</p>
                    <div class="mt-auto flex items-center justify-between pt-8 border-t border-gray-50">
                      <div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Price Start From</span>
                        <span class="text-xl font-black text-brand-darkest">{{ product.price }}</span>
                      </div>
                      <div class="w-12 h-12 rounded-2xl bg-brand-darkest group-hover:bg-brand-primary text-white flex items-center justify-center transition shadow-lg">
                        <i class="fas fa-chevron-right text-xs"></i>
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
export class ProductCategoryComponent implements OnInit {
  categorySlug = signal<string>('all');
  
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

  private slugify(text: string): string {
    return text.replace(/\s+/g, '-').toLowerCase();
  }
}
