
import { Component, OnInit, OnDestroy, signal, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { BlogPost } from '../../models/types';

@Component({
  selector: 'app-blog-post-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in bg-brand-body min-h-screen text-brand-mainText">
      <!-- Reading Progress Bar -->
      <div class="fixed top-20 left-0 w-full h-1.5 z-[110] bg-brand-navBorder">
        <div 
          class="h-full bg-brand-primary transition-all duration-150 shadow-[0_0_10px_rgba(0,91,150,0.3)]" 
          [style.width.%]="readingProgress()"
        ></div>
      </div>

      @if (blog()) {
        <div class="h-[300px] md:h-[500px] overflow-hidden bg-white">
          <img [src]="blog()!.image" class="w-full h-full object-contain" [alt]="blog()!.title" />
        </div>
        <div class="relative -mt-[300px] md:-mt-[500px] h-[300px] md:h-[500px] flex items-end">
          <div class="absolute inset-0 bg-gradient-to-t from-brand-darkest via-brand-darkest/60 to-transparent flex items-end">
            <div class="container mx-auto px-6 py-20">
              <div class="max-w-4xl">
                <a routerLink="/blog" class="text-brand-primary font-black text-[10px] uppercase tracking-[0.4em] mb-8 inline-flex items-center gap-3 hover:text-white transition group">
                  <i class="fas fa-arrow-left group-hover:-translate-x-2 transition-transform"></i> Back to Intelligence Reports
                </a>
                <h1 class="text-4xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-[0.95] mb-10 drop-shadow-2xl">
                  {{ blog()!.title }}
                </h1>
                <div class="flex flex-wrap items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-brand-lightest">
                  <span class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                    <i class="fas fa-user-shield text-brand-primary"></i> {{ blog()!.author }}
                  </span>
                  <span class="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full backdrop-blur-md border border-white/10">
                    <i class="fas fa-calendar-alt text-brand-primary"></i> {{ blog()!.date }}
                  </span>
                  <span class="flex items-center gap-2 px-4 py-2 bg-brand-primary/20 text-brand-primary rounded-full backdrop-blur-md border border-brand-primary/20">
                    <i class="fas fa-clock"></i> {{ readTime() }} Min Technical Read
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <section class="py-24 relative overflow-hidden">
          <!-- Background Decorative Elements -->
          <div class="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] -mr-64 -mt-64"></div>
          <div class="absolute bottom-0 left-0 w-[500px] h-[500px] bg-brand-darkest/5 rounded-full blur-[120px] -ml-64 -mb-64"></div>
          
          <div class="container mx-auto px-6 relative z-10">
            <div class="max-w-3xl mx-auto">
              
              <div class="space-y-12">
                @for (para of paragraphs(); track $index; let idx = $index) {
                  <p [class]="idx === 0 ? 'text-2xl md:text-3xl text-brand-darkest font-black not-italic border-l-8 border-brand-primary pl-10 py-8 mb-20 bg-brand-alt rounded-r-[40px] shadow-sm' : 'text-lg md:text-xl leading-[2.1] text-brand-mutedText italic font-medium tracking-wide'">
                    {{ para }}
                  </p>

                  <!-- Interspersed Gallery Image 1 -->
                  @if (idx === 1 && gallery()[0]) {
                    <div class="my-20 group">
                      <div class="group overflow-hidden rounded-[24px] md:rounded-[40px] shadow-2xl border-4 md:border-8 border-white bg-white">
                        <img [src]="gallery()[0]" alt="Industrial Process" class="w-full h-auto object-contain max-h-[550px] group-hover:scale-105 transition-transform duration-[3000ms]" />
                      </div>
                      <figcaption class="bg-brand-alt p-8 text-[11px] font-black uppercase tracking-widest text-brand-primary text-center">
                          <i class="fas fa-microscope mr-2"></i> Technical Precision: Automated Manufacturing Protocols at SafeSmart Headquarters
                        </figcaption>
                    </div>
                  }

                  <!-- SafeSmart Insight Callout -->
                  @if (idx === 2) {
                    <div class="my-20 bg-brand-darkest rounded-[48px] p-12 text-white relative overflow-hidden group hover:shadow-3xl transition-all duration-700 hover:-rotate-1">
                      <div class="absolute top-0 right-0 w-48 h-48 bg-brand-primary/20 rounded-full -mr-24 -mt-24 blur-3xl"></div>
                      <div class="absolute -bottom-10 -left-10 text-brand-primary/10 text-9xl font-black">
                        <i class="fas fa-shield-halved"></i>
                      </div>
                      <div class="relative z-10">
                        <span class="text-brand-primary font-black uppercase tracking-[0.5em] text-[10px] mb-6 block">SafeSmart Executive Summary</span>
                        <h4 class="text-2xl font-black uppercase italic tracking-tight mb-6">Redefining the Industry Benchmark</h4>
                        <p class="text-base text-brand-lightest leading-relaxed font-medium italic opacity-90">
                          "We are not burdened by half-century-old machinery. Every SafeSmart blueprint was drafted with the 2023 BIS revisions as the baseline. While legacy competitors 'patch' old designs, we engineer new ones using robotic tolerances that leave zero room for error."
                        </p>
                      </div>
                    </div>
                  }

                  <!-- Interspersed Gallery Image 2 -->
                  @if (idx === 3 && gallery()[1]) {
                    <div class="my-20 -mx-6 md:-mx-32">
                      <div class="group overflow-hidden rounded-[24px] md:rounded-[40px] shadow-2xl border-4 md:border-8 border-white h-full min-h-[300px] bg-white">
                        <img [src]="gallery()[1]" alt="Modern Security Detail" class="w-full h-full object-contain group-hover:scale-110 transition duration-[5000ms]" />
                      </div>
                      <div class="absolute inset-0 bg-gradient-to-t from-brand-darkest/70 via-transparent to-transparent"></div>
                        <div class="absolute bottom-12 left-12 right-12 flex items-end justify-between">
                           <div>
                             <p class="text-brand-primary text-[10px] font-black uppercase tracking-[0.4em] mb-2">Quality Control Manifest</p>
                             <h5 class="text-3xl text-white font-black uppercase italic tracking-tighter">Engineered for absolute asset integrity.</h5>
                           </div>
                           <div class="hidden md:block w-20 h-20 border-2 border-white/20 rounded-full flex items-center justify-center text-white text-xs font-black animate-spin-slow">
                              2024 REV
                           </div>
                        </div>
                    </div>
                  }

                  <!-- Interspersed Gallery Image 3 -->
                  @if (idx === 5 && gallery()[2]) {
                    <div class="my-20 float-right w-full md:w-1/2 md:ml-16 md:mb-16">
                      <div class="bg-brand-alt p-6 rounded-[48px] shadow-2xl border border-brand-navBorder group transform hover:rotate-3 transition duration-500">
                        <div class="group overflow-hidden rounded-[20px] md:rounded-[32px] shadow-xl border-4 border-white bg-white">
                           <img [src]="gallery()[2]" alt="Lab Testing" class="w-full h-auto object-contain aspect-square group-hover:scale-110 transition-transform duration-700" />
                        </div>
                        <div class="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl">
                              <i class="fas fa-vial text-brand-primary"></i>
                           </div>
                        <p class="mt-6 text-[10px] font-black uppercase tracking-widest text-center text-brand-mutedText">
                           <i class="fas fa-check-circle text-green-500 mr-2"></i> Lab Verification Analysis
                        </p>
                      </div>
                    </div>
                  }

                   <!-- Final Gallery Image -->
                   @if (idx === paragraphs().length - 1 && gallery()[3]) {
                    <div class="mt-20">
                      <div class="group overflow-hidden rounded-[20px] md:rounded-[32px] shadow-xl border-4 border-white h-full bg-white">
                        <img [src]="gallery()[3]" alt="Strategic Deployment" class="w-full h-full object-contain group-hover:scale-105 transition duration-700" />
                      </div>
                    </div>
                  }
                }
              </div>

              <!-- Author Profile Card -->
              <div class="mt-32 pt-20 border-t border-brand-navBorder">
                <div class="flex flex-col md:flex-row items-center justify-between gap-12 bg-brand-alt p-12 rounded-[56px] shadow-sm hover:shadow-2xl transition-all duration-700">
                  <div class="flex items-center gap-8">
                    <div class="w-24 h-24 bg-brand-darkest rounded-[32px] flex items-center justify-center text-white text-4xl shadow-2xl relative group overflow-hidden">
                      <i class="fas fa-fingerprint group-hover:scale-150 transition duration-700 text-brand-primary"></i>
                      <div class="absolute inset-0 bg-brand-primary opacity-0 group-hover:opacity-20 transition-opacity"></div>
                    </div>
                    <div>
                      <h4 class="font-black text-brand-darkest uppercase tracking-widest text-[12px] mb-2 flex items-center gap-2">
                         <span class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                         Verified Security Analyst
                      </h4>
                      <p class="text-brand-mutedText text-[11px] italic max-w-sm leading-relaxed opacity-80 font-medium">
                        This technical briefing is part of SafeSmart's 2024 Transparency Initiative. We aim to provide objective engineering data to help decision-makers protect their most critical assets.
                      </p>
                    </div>
                  </div>
                  <div class="flex gap-4">
                    <button class="w-16 h-16 rounded-3xl bg-white text-brand-primary flex items-center justify-center hover:bg-brand-primary hover:text-white transition-all shadow-md active:scale-95 border border-transparent hover:border-white"><i class="fab fa-facebook-f"></i></button>
                    <button class="w-16 h-16 rounded-3xl bg-white text-brand-darkest flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-md active:scale-95 border border-transparent hover:border-white"><i class="fab fa-linkedin-in"></i></button>
                    <button class="w-16 h-16 rounded-3xl bg-brand-primary text-white flex items-center justify-center hover:bg-brand-dark transition-all shadow-md active:scale-95 border border-white/20"><i class="fas fa-share-alt"></i></button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Recommended Intelligence Hub -->
        <section class="py-24 bg-brand-alt relative overflow-hidden">
          <div class="container mx-auto px-6 relative z-10">
            <div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div>
                <span class="text-brand-primary font-black uppercase tracking-[0.4em] text-[10px] mb-4 block">Strategic Depth</span>
                <h3 class="text-3xl md:text-5xl font-black text-brand-darkest uppercase italic tracking-tighter leading-none">Further Reading</h3>
              </div>
              <a routerLink="/blog" class="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:text-brand-dark transition-colors flex items-center gap-3 group px-6 py-3 bg-white rounded-2xl shadow-sm hover:shadow-md">
                Explore All Intel <i class="fas fa-arrow-right group-hover:translate-x-2 transition-transform"></i>
              </a>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
              @for (related of relatedBlogs(); track related.id; let idx = $index) {
                <a [routerLink]="['/blog', related.slug]" class="group bg-brand-body p-10 rounded-[48px] shadow-sm hover:shadow-3xl transition-all duration-500 border border-brand-navBorder hover:-translate-y-4"
                   [class]="'stagger-' + (idx + 1)">
                  <div class="flex justify-between items-start mb-8">
                     <span class="text-[10px] font-black text-brand-primary uppercase tracking-[0.3em]">{{ related.date }}</span>
                     <i class="fas fa-shield-halved text-brand-lightest opacity-30 text-xl group-hover:text-brand-primary group-hover:opacity-100 transition duration-500"></i>
                  </div>
                  <h5 class="text-xl font-black text-brand-darkest uppercase italic tracking-tight mb-8 group-hover:text-brand-primary transition leading-tight line-clamp-2">
                    {{ related.title }}
                  </h5>
                  <div class="text-brand-primary text-[11px] font-black uppercase tracking-widest flex items-center gap-3 group-hover:gap-5 transition-all">
                    Access Report <i class="fas fa-arrow-right"></i>
                  </div>
                </a>
              }
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 8s linear infinite;
    }
  `]
})
export class BlogPostDetailComponent implements OnInit, OnDestroy {
  slug = signal<string | null>(null);
  readingProgress = signal(0);

  blog = computed(() => {
    const s = this.slug();
    if (!s) return null;
    return this.dataService.getBlogs().find(b => b.slug === s) || null;
  });

  paragraphs = computed(() => {
    const b = this.blog();
    if (!b) return [];
    return b.content.split('\n\n');
  });

  gallery = computed(() => {
    const b = this.blog();
    return b?.gallery || [];
  });

  readTime = computed(() => {
    return Math.ceil(this.paragraphs().length * 1.5);
  });

  relatedBlogs = computed(() => {
    const s = this.slug();
    return this.dataService.getBlogs().filter(b => b.slug !== s).slice(0, 3);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService
  ) { }

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const s = params.get('slug');
      if (s) {
        this.slug.set(s);
        const b = this.dataService.getBlogs().find(blog => blog.slug === s);
        if (!b) {
          this.router.navigate(['/blog']);
        }
      }
    });
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
      const progress = (window.scrollY / scrollHeight) * 100;
      this.readingProgress.set(progress);
    }
  }

  ngOnDestroy() { }
}
