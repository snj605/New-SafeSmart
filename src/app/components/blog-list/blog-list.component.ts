
import { Component, computed } from '@angular/core';
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
                [routerLink]="['/blog', blog.slug]" 
                class="bg-brand-body rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all group border border-brand-navBorder"
              >
                <div class="h-64 overflow-hidden">
                  <img 
                    [src]="blog.image" 
                    class="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
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
export class BlogListComponent {
  blogs = computed(() => this.dataService.getBlogs());

  constructor(private dataService: DataService) {}
}
