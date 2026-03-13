
import { Component, computed, OnInit, AfterViewInit, OnDestroy, ElementRef, QueryList, ViewChildren, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="animate-fade-in bg-brand-alt min-h-screen text-brand-mainText">
      <section class="bg-brand-darkest py-20 text-white text-center">
        <div class="container mx-auto px-4">
          <h1 class="text-3xl md:text-5xl font-black uppercase italic mb-4">Security Insights</h1>
          <p class="text-brand-lightest uppercase tracking-[0.2em] text-[10px] md:text-xs">Expert advice and the latest industry trends</p>
        </div>
      </section>

      <section class="py-24">
        <div class="container mx-auto px-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            @for (blog of blogs(); track blog.id) {
              <a 
                #blogCard
                [attr.data-id]="blog.id"
                [routerLink]="['/blog', blog.slug]" 
                class="bg-brand-body rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-brand-navBorder"
              >
                <div class="h-64 overflow-hidden bg-white">
                  <img 
                    [src]="blog.image" 
                    class="w-full h-full object-contain group-hover:scale-105 transition duration-500"
                    [class.opacity-100]="activeBlogId() === blog.id"
                    [class.opacity-60]="activeBlogId() !== blog.id"
                    [class.lg:opacity-100]="true"
                    [alt]="blog.title" 
                  />
                </div>
                <div class="p-8">
                  <div class="flex items-center gap-4 text-[10px] font-bold uppercase text-brand-primary mb-4 tracking-widest">
                    <span>{{ blog.date }}</span>
                    <span class="w-1 h-1 bg-brand-mutedText rounded-full opacity-30"></span>
                    <span>By {{ blog.author }}</span>
                  </div>
                  <h3 class="text-xl font-black text-brand-darkest mb-4 group-hover:text-brand-primary transition uppercase tracking-tight leading-tight">
                    {{ blog.title }}
                  </h3>
                  <p class="text-brand-mutedText text-sm mb-6 line-clamp-3 leading-relaxed italic">
                    {{ blog.excerpt }}
                  </p>
                  <span class="text-[10px] font-black uppercase tracking-widest text-brand-darkest border-b-2 border-brand-primary pb-1 inline-block">
                    Read Story
                  </span>
                </div>
              </a>
            }
          </div>
        </div>
      </section>
    </div>
  `,
  styles: []
})
export class BlogListComponent implements OnInit, AfterViewInit, OnDestroy {
  blogs = computed(() => this.dataService.getBlogs());

  @ViewChildren('blogCard') blogCards!: QueryList<ElementRef>;
  activeBlogId = signal<string | null>(null);
  private observer: IntersectionObserver | null = null;

  constructor(private dataService: DataService) {}

  ngOnInit() { }

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
          this.activeBlogId.set(id);
        }
      });
    }, options);

    this.blogCards.changes.subscribe(() => {
      this.blogCards.forEach(card => this.observer?.observe(card.nativeElement));
    });

    this.blogCards.forEach(card => this.observer?.observe(card.nativeElement));

    // Default to first blog if available
    const currentBlogs = this.blogs();
    if (currentBlogs.length > 0) this.activeBlogId.set(currentBlogs[0].id);
  }
}
