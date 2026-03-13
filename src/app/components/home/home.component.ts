import { Component, Input, OnInit, signal, computed, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';
import { HeroSliderComponent } from '../hero-slider/hero-slider.component';
import { CommonContactFormComponent } from '../common-contact-form/common-contact-form.component';
import { SafeUrlPipe } from '../../shared/pipes/safe-url.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, HeroSliderComponent, CommonContactFormComponent, SafeUrlPipe],
  template: `
    <div class="font-sans bg-brand-body text-brand-mainText">
      <app-hero-slider [slides]="homeContent().hero.slides"></app-hero-slider>

      <!-- Welcome Section -->
      <section class="py-16 md:py-24 bg-brand-body text-center overflow-hidden">
        <div class="container mx-auto px-6">
          <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block animate-reveal stagger-1">
            Legacy of Protection
          </span>
          <h2 class="text-3xl md:text-5xl lg:text-6xl font-black text-brand-darkest uppercase italic tracking-tighter leading-tight mb-8 animate-reveal stagger-2">
            {{ homeContent().welcome.title }}
          </h2>
          <div class="w-16 md:w-24 h-1 bg-brand-primary mx-auto mb-8 rounded-full animate-reveal stagger-2"></div>
          <p class="text-lg md:text-2xl text-brand-mutedText font-light max-w-3xl mx-auto leading-relaxed animate-reveal stagger-3">
            {{ homeContent().welcome.subtitle }}
          </p>
        </div>
      </section>

      <!-- Intro Section -->
      <section class="py-16 md:py-24 bg-brand-alt overflow-hidden border-y border-brand-navBorder">
        <div class="container mx-auto px-6">
          <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div class="w-full lg:w-1/2 animate-reveal">
              <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">
                {{ homeContent().intro.tagline }}
              </span>
              <h2 class="text-3xl md:text-5xl font-black text-brand-darkest mb-8 md:mb-10 uppercase italic tracking-tighter leading-tight">
                {{ homeContent().intro.title }}
              </h2>
              <div class="text-brand-mutedText leading-relaxed mb-10 italic border-l-4 border-brand-primary pl-6 md:pl-8 text-base md:text-lg">
                <p>{{ homeContent().intro.description }}</p>
              </div>
              <a routerLink="/about" class="w-full sm:w-auto inline-flex items-center justify-center gap-4 bg-brand-darkest text-white px-8 md:px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-primary transition-all shadow-xl active:scale-95">
                Read Company History <i class="fas fa-chevron-right text-[8px]"></i>
              </a>
            </div>
            
            <div class="w-full lg:w-1/2 relative animate-reveal stagger-2">
              <div class="aspect-video lg:aspect-square bg-white rounded-[32px] md:rounded-[48px] overflow-hidden shadow-3xl border-4 md:border-8 border-brand-body group relative">
                <video 
                  class="w-full h-full object-contain"
                  autoPlay 
                  muted 
                  loop 
                  playsInline 
                  [poster]="homeContent().intro.image"
                >
                  <source [src]="homeContent().intro.videoUrl | safeUrl" type="video/mp4" />
                </video>
                <div class="absolute inset-0 bg-brand-darkest/20 group-hover:bg-transparent transition duration-700"></div>
                <div class="absolute bottom-6 left-6 md:bottom-10 md:left-10 flex items-center gap-4 text-white">
                   <div class="w-10 h-10 md:w-12 md:h-12 bg-brand-primary rounded-full flex items-center justify-center animate-pulse">
                      <i class="fas fa-play text-[10px]"></i>
                   </div>
                   <span class="text-[10px] font-black uppercase tracking-widest text-white">Live Product Demo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Product Categories -->
      <section class="py-16 md:py-24 bg-brand-body">
        <div class="container mx-auto px-6">
          <div class="text-center mb-16 md:mb-20">
            <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block animate-reveal">
              {{ homeContent().productsHeader.tagline }}
            </span>
            <h2 class="text-3xl md:text-6xl font-black text-brand-darkest uppercase italic tracking-tighter leading-none animate-reveal">
              {{ homeContent().productsHeader.title }}
            </h2>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            @if (secondaryLoading()) {
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="h-[380px] md:h-[450px] rounded-[32px] md:rounded-[48px] skeleton"></div>
              }
            } @else {
              @for (cat of categories(); track cat.id; let idx = $index) {
                <a
                  #categoryCard
                  [attr.data-id]="cat.id"
                  [routerLink]="['/category', slugify(cat.name)]"
                  class="group relative h-[380px] md:h-[450px] rounded-[32px] md:rounded-[48px] overflow-hidden shadow-sm transition-all duration-500 flex flex-col justify-end p-8 md:p-10 border border-brand-navBorder hover-lift animate-reveal"
                  [class]="'stagger-' + ((idx % 3) + 1)"
                >
                  <div class="absolute inset-0 overflow-hidden">
                      <img
                        [src]="cat.image"
                        loading="lazy"
                        decoding="async"
                        class="w-full h-full object-contain transition-all duration-700 scale-100 group-hover:scale-105"
                        [class.opacity-100]="activeCategoryId() === cat.id"
                        [class.opacity-60]="activeCategoryId() !== cat.id"
                        [class.grayscale-0]="true"
                        [class.lg:opacity-75]="activeCategoryId() !== cat.id"
                        [class.lg:group-hover:opacity-100]="true"
                        [alt]="cat.name"
                      />
                  </div>
                  <div class="relative z-10">
                    <div class="w-14 h-14 md:w-16 md:h-16 bg-brand-darkest rounded-2xl flex items-center justify-center text-white mb-6 md:mb-8 group-hover:bg-brand-primary group-hover:scale-110 transition duration-300 shadow-xl">
                      <i [class]="'fas fa-' + (cat.icon || 'shield-halved') + ' text-xl md:text-2xl'"></i>
                    </div>
                    <h4 class="text-xl md:text-2xl font-black text-brand-darkest uppercase italic tracking-tight mb-4 group-hover:text-brand-primary transition duration-200">{{ cat.name }}</h4>
                    <div class="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-brand-darkest group-hover:gap-6 transition-all duration-300">
                      Explore Details <i class="fas fa-arrow-right text-brand-primary"></i>
                    </div>
                  </div>
                </a>
              }
            }
          </div>
        </div>
      </section>

      <!-- Institutional Range Showcase -->
      <section class="py-16 md:py-24 bg-brand-alt border-y border-brand-navBorder">
        <div class="container mx-auto px-6">
          <div class="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div class="w-full lg:w-1/2 animate-reveal">
              <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">
                The Complete Defense
              </span>
              <h2 class="text-3xl md:text-5xl font-black text-brand-darkest mb-8 uppercase italic tracking-tighter leading-tight">
                Institutional Security Range
              </h2>
              <p class="text-brand-mutedText leading-relaxed mb-10 text-base md:text-lg">
                At SafeSmart, we don't just build safes; we engineer total security environments. Our Defender Plus+ series represents the pinnacle of physical armor, ranging from compact 26-inch units for retail to 6-foot vertical vaults and heavy-duty store room doors. Every unit is a testament to our commitment to 21st-century precision.
              </p>
              <div class="grid grid-cols-2 gap-8 mb-12">
                <div class="p-6 bg-white rounded-3xl border border-brand-navBorder shadow-sm hover-lift transition-all">
                  <div class="text-brand-primary font-black text-3xl mb-1">BIS 2023</div>
                  <div class="text-[9px] font-black uppercase tracking-[0.2em] text-brand-darkest opacity-60">Certified Standard</div>
                </div>
                <div class="p-6 bg-white rounded-3xl border border-brand-navBorder shadow-sm hover-lift transition-all">
                  <div class="text-brand-primary font-black text-3xl mb-1">Grade I & II</div>
                  <div class="text-[9px] font-black uppercase tracking-[0.2em] text-brand-darkest opacity-60">Burglary Resistance</div>
                </div>
              </div>
            </div>
            <div class="w-full lg:w-1/2 animate-reveal stagger-2">
              <div class="rounded-[40px] overflow-hidden shadow-3xl border-8 border-white bg-white">
                <img 
                  [src]="homeContent().rangeShowcaseImage" 
                  class="w-full h-auto object-contain hover:scale-105 transition duration-700"
                  alt="SafeSmart Product Range" 
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Trust Badges -->
      <section class="py-16 md:py-24 bg-brand-darkest relative overflow-hidden">
        <div class="absolute inset-0 opacity-5 yogi-pattern"></div>
        <div class="container mx-auto px-6 relative z-10 text-center">
           <h2 class="text-2xl md:text-5xl font-black text-white uppercase italic tracking-tighter mb-12 md:mb-16">
             {{ homeContent().trust.title }}
           </h2>
           <div class="flex flex-wrap justify-center items-center gap-10 md:gap-32">
              @if (secondaryLoading()) {
                @for (i of [1,2,3]; track i) {
                  <div class="w-40 h-40 rounded-full skeleton-dark opacity-20"></div>
                }
              } @else {
                @for (badge of homeContent().trust.badges; track badge; let i = $index) {
                  <div class="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl hover:scale-110 transition duration-300 group cursor-pointer animate-reveal">
                    <img [src]="badge" loading="lazy" class="h-20 md:h-40 object-contain group-hover:brightness-110" alt="Certification Logo" />
                  </div>
                }
              }
           </div>
        </div>
      </section>

      <!-- Why Choose Us -->
      <section class="py-16 md:py-24 bg-brand-body relative overflow-hidden">
        <div class="container mx-auto px-6">
          <div class="text-center mb-16 md:mb-20 max-w-4xl mx-auto">
            <h2 class="text-3xl md:text-6xl font-black text-brand-darkest uppercase italic tracking-tighter mb-4 animate-reveal">
              {{ homeContent().whyChooseUs.title }}
            </h2>
            <h4 class="text-sm md:text-xl font-bold text-brand-primary uppercase tracking-widest mb-8 animate-reveal">
              {{ homeContent().whyChooseUs.subtitle }}
            </h4>
            <p class="text-brand-mutedText italic leading-relaxed text-base md:text-lg animate-reveal">
              {{ homeContent().whyChooseUs.description }}
            </p>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
            @if (secondaryLoading()) {
              @for (i of [1,2,3,4]; track i) {
                <div class="h-48 rounded-[40px] skeleton"></div>
              }
            } @else {
              @for (feature of homeContent().whyChooseUs.features; track feature.id; let idx = $index) {
                <div class="group flex flex-col items-center text-center p-8 bg-brand-alt rounded-[32px] md:rounded-[40px] hover:bg-brand-darkest hover:text-white transition duration-300 shadow-sm hover:shadow-2xl hover-lift animate-reveal"
                    [class]="'stagger-' + ((idx % 4) + 1)">
                  <div class="w-16 h-16 md:w-20 md:h-20 mb-6 bg-white rounded-2xl p-4 shadow-inner group-hover:scale-110 transition duration-300">
                    <img [src]="feature.icon" loading="lazy" class="w-full h-full object-contain" [alt]="feature.title" />
                  </div>
                  <h5 class="text-[10px] md:text-sm font-black uppercase tracking-widest leading-tight">
                    {{ feature.title }}
                  </h5>
                </div>
              }
            }
          </div>
        </div>
      </section>

      <!-- Blog Previews -->
      <section class="py-16 md:py-24 bg-brand-alt">
        <div class="container mx-auto px-6">
           <div class="mb-16 md:mb-20">
              <app-common-contact-form></app-common-contact-form>
           </div>

          <div class="flex flex-col md:flex-row justify-between items-end mb-12 md:mb-16 gap-6">
            <div class="animate-reveal">
              <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">
                {{ homeContent().blogHeader.tagline }}
              </span>
              <h2 class="text-3xl md:text-5xl font-black text-brand-darkest uppercase italic tracking-tighter leading-none">
                {{ homeContent().blogHeader.title }}
              </h2>
            </div>
            <a routerLink="/blog" class="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-dark transition-colors flex items-center gap-2 group animate-reveal">
              View All Intelligence <i class="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </a>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            @if (secondaryLoading()) {
              @for (i of [1,2,3]; track i) {
                <div class="h-96 rounded-[32px] md:rounded-[40px] skeleton"></div>
              }
            } @else {
              @for (blog of blogs().slice(0, 3); track blog.id; let idx = $index) {
                <a [routerLink]="['/blog', blog.slug]" class="group bg-brand-body rounded-[32px] md:rounded-[40px] overflow-hidden shadow-sm transition-all duration-300 hover-lift border border-brand-navBorder animate-reveal"
                   [class]="'stagger-' + (idx + 1)">
                  <div class="h-56 md:h-64 overflow-hidden relative bg-white">
                    <img [src]="blog.image" loading="lazy" class="w-full h-full object-contain group-hover:scale-110 transition duration-500" [alt]="blog.title" />
                    <div class="absolute top-4 left-4 md:top-6 md:left-6 bg-brand-primary text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                      {{ blog.date }}
                    </div>
                  </div>
                  <div class="p-8">
                    <h4 class="text-base md:text-lg font-black text-brand-darkest uppercase italic tracking-tight mb-4 group-hover:text-brand-primary transition duration-200 line-clamp-2">
                      {{ blog.title }}
                    </h4>
                    <p class="text-[10px] md:text-xs text-brand-mutedText leading-relaxed mb-6 line-clamp-2">
                      {{ blog.excerpt }}
                    </p>
                    <div class="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-brand-darkest">
                      Study Report <i class="fas fa-chevron-right text-brand-primary text-[8px]"></i>
                    </div>
                  </div>
                </a>
              }
            }
          </div>
        </div>
      </section>

      <!-- Final CTA -->
      <section class="bg-brand-darkest py-20 md:py-28 relative overflow-hidden border-t-8 border-brand-primary">
        <div class="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=1920')] bg-cover bg-center"></div>
        <div class="container mx-auto px-6 text-center relative z-10">
          <p class="text-brand-light uppercase tracking-[0.5em] text-[10px] font-black mb-6 animate-reveal">Securing India Since Inception</p>
          <h2 class="text-3xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-10 md:mb-12 leading-tight animate-reveal">
            Because better business <br class="hidden md:block" /> needs better security
          </h2>
          <a routerLink="/contact" class="w-full sm:w-auto inline-block bg-brand-primary hover:bg-white hover:text-brand-darkest text-white px-10 md:px-16 py-5 md:py-7 rounded-2xl font-black uppercase tracking-[0.2em] text-xs md:text-sm shadow-2xl transition transform hover:scale-105 active:scale-95 animate-reveal stagger-2">
            Request a Quote
          </a>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  appData = computed(() => this.dataService.getAppData());
  homeContent = computed(() => this.appData().content.home);
  categories = computed(() => this.dataService.getCategories());
  blogs = computed(() => this.dataService.getBlogs());
  secondaryLoading = computed(() => this.dataService.isSecondaryLoading());

  @ViewChildren('categoryCard') categoryCards!: QueryList<ElementRef>;
  activeCategoryId = signal<string | null>(null);
  private observer: IntersectionObserver | null = null;

  constructor(private dataService: DataService) {
    // Set initial active ID if possible
    const cats = this.categories();
    if (cats.length > 0) this.activeCategoryId.set(cats[0].id);
  }

  ngOnInit() { }

  ngAfterViewInit() {
    this.setupIntersectionObserver();
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }

  private setupIntersectionObserver() {
    // Only use for smaller screens where hover doesn't exist/work well
    if (typeof window === 'undefined') return;

    const options = {
      root: null,
      rootMargin: '-20% 0px -20% 0px', // Middle 60% of screen
      threshold: 0.1
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('data-id');
          this.activeCategoryId.set(id);
        }
      });
    }, options);

    this.categoryCards.changes.subscribe(() => {
      this.categoryCards.forEach(card => this.observer?.observe(card.nativeElement));
    });

    // Initial observation
    this.categoryCards.forEach(card => this.observer?.observe(card.nativeElement));
  }

  slugify(text: string): string {
    return text.replace(/\s+/g, '-').toLowerCase();
  }
}
