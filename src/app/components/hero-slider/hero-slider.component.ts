
import { Component, Input, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HeroSlide } from '../../models/types';

@Component({
    selector: 'app-hero-slider',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
    <section 
      class="relative min-h-[90vh] md:h-screen overflow-hidden bg-brand-darkest touch-pan-y"
      (touchstart)="onTouchStart($event)"
      (touchmove)="onTouchMove($event)"
      (touchend)="onTouchEnd()"
    >
      @for (slide of slides; track slide.id; let index = $index) {
        <div
          class="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          [class.opacity-100]="index === current()"
          [class.z-10]="index === current()"
          [class.opacity-0]="index !== current()"
          [class.z-0]="index !== current()"
        >
          <!-- Background Layer with Zoom Effect -->
          <div class="absolute inset-0 z-0">
            <img 
              [src]="slide.image" 
              class="w-full h-full object-cover transition-transform duration-[20000ms] ease-out"
              [class.scale-125]="index === current()"
              [class.scale-100]="index !== current()"
              [alt]="slide.title" 
              [loading]="index === 0 ? 'eager' : 'lazy'"
            />
            <!-- Immersive Gradient Overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-brand-darkest via-brand-darkest/40 to-transparent"></div>
          </div>

          <div class="container mx-auto px-6 h-full flex items-center lg:items-end pb-20 md:pb-32 relative z-10 pt-20 lg:pt-0">
            <div class="flex flex-col lg:flex-row items-center lg:items-end justify-between w-full gap-10 lg:gap-16">
              
              <!-- Product Element -->
              <div class="w-full max-w-[240px] md:max-w-md xl:max-w-lg transition-all duration-1000 transform delay-700 order-1 lg:order-2"
                   [class.translate-y-0]="index === current()" [class.opacity-100]="index === current()" [class.scale-100]="index === current()"
                   [class.translate-y-12]="index !== current()" [class.opacity-0]="index !== current()" [class.scale-95]="index !== current()">
                <div class="relative group">
                  <div class="absolute -inset-16 md:-inset-24 bg-brand-primary/10 rounded-full blur-[100px] md:blur-[140px] group-hover:bg-brand-primary/20 transition-all duration-[2000ms]"></div>
                  
                  <img 
                    [src]="slide.productImage || lockerImageUrl"
                    class="relative z-10 w-full h-auto drop-shadow-[0_40px_60px_rgba(0,0,0,0.6)] md:drop-shadow-[0_60px_90px_rgba(0,0,0,0.7)] animate-float"
                    alt="SafeSmart Security Unit"
                  />
                  
                  <div class="absolute -top-4 -right-4 z-20 bg-brand-primary text-white p-3 md:p-6 rounded-2xl md:rounded-[32px] shadow-3xl transform rotate-12 border border-white/10 flex flex-col items-center">
                    <span class="text-[7px] md:text-[9px] font-black uppercase tracking-widest">Grade I</span>
                    <i class="fas fa-shield-halved text-sm md:text-xl my-0.5 md:my-1"></i>
                    <span class="text-[6px] md:text-[8px] font-bold opacity-60">CERTIFIED</span>
                  </div>
                </div>
              </div>

              <!-- Text Content -->
              <div class="max-w-2xl text-center lg:text-left transform transition-all duration-1000 delay-300 order-2 lg:order-1"
                   [class.translate-y-0]="index === current()" [class.opacity-100]="index === current()"
                   [class.translate-y-12]="index !== current()" [class.opacity-0]="index !== current()">
                <span class="text-brand-primary font-black text-[10px] md:text-[11px] uppercase tracking-[0.4em] mb-4 md:mb-5 block animate-reveal">
                   Legacy of Protection
                </span>
                
                <h1 class="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-black text-white uppercase italic tracking-tighter leading-tight mb-5 md:mb-7 drop-shadow-2xl">
                  {{ slide.title }}
                </h1>
                
                <p class="text-xs md:text-sm lg:text-base text-brand-lightest mb-8 md:mb-10 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed opacity-70 italic">
                  {{ slide.subtitle }}
                </p>
                
                <div class="flex flex-wrap justify-center lg:justify-start gap-3 md:gap-4">
                  <a
                    [routerLink]="slide.ctaLink"
                    class="bg-brand-primary hover:bg-white hover:text-brand-darkest text-white px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] transition-all shadow-xl hover:scale-105 active:scale-95"
                  >
                    Explore Range
                  </a>
                  <a
                    routerLink="/contact"
                    class="bg-white/5 hover:bg-white/10 backdrop-blur-xl text-white border border-white/10 px-8 md:px-10 py-3.5 md:py-4 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-[0.2em] transition-all"
                  >
                    Enquire Now
                  </a>
                </div>
              </div>

            </div>
          </div>
        </div>
      }

      <!-- Slide Indicators -->
      @if (slides.length > 1) {
        <div class="absolute bottom-6 left-6 md:bottom-10 md:left-12 flex gap-2 z-30">
          @for (slide of slides; track slide.id; let i = $index) {
            <button
              (click)="setCurrent(i)"
              [class]="'h-1 rounded-full transition-all duration-500 ' + (i === current() ? 'w-8 bg-brand-primary' : 'w-2 bg-white/20')"
              [attr.aria-label]="'Go to slide ' + (i + 1)">
            </button>
          }
        </div>
      }

      <!-- Navigation Controls -->
      <div class="absolute bottom-6 right-6 md:bottom-10 md:right-12 z-30 flex items-center gap-2">
        <button 
          (click)="handlePrev()"
          class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 backdrop-blur-xl text-white flex items-center justify-center border border-white/10 hover:bg-brand-primary hover:border-brand-primary transition-all active:scale-90 group"
          aria-label="Previous Slide"
        >
          <i class="fas fa-chevron-left text-[10px] group-hover:-translate-x-0.5 transition-transform"></i>
        </button>
        <button 
          (click)="handleNext()"
          class="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white/5 backdrop-blur-xl text-white flex items-center justify-center border border-white/10 hover:bg-brand-primary hover:border-brand-primary transition-all active:scale-90 group"
          aria-label="Next Slide"
        >
          <i class="fas fa-chevron-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
        </button>
      </div>
    </section>
  `,
    styles: [`
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }
    .animate-float {
      animation: float 6s infinite ease-in-out;
    }
  `]
})
export class HeroSliderComponent implements OnInit, OnDestroy {
    @Input({ required: true }) slides: HeroSlide[] = [];

    current = signal(0);
    lockerImageUrl = "assets/images/door-1-copy.png";

    private timer: any;
    private touchStart: number | null = null;
    private touchEnd: number | null = null;
    private minSwipeDistance = 50;

    ngOnInit() {
        this.startTimer();
    }

    ngOnDestroy() {
        this.stopTimer();
    }

    handleNext() {
        this.current.update(v => (v + 1) % this.slides.length);
    }

    handlePrev() {
        this.current.update(v => (v - 1 + this.slides.length) % this.slides.length);
    }

    setCurrent(index: number) {
        this.current.set(index);
        this.resetTimer();
    }

    private startTimer() {
        if (this.slides.length <= 1) return;
        this.timer = setInterval(() => {
            this.handleNext();
        }, 8000);
    }

    private stopTimer() {
        if (this.timer) clearInterval(this.timer);
    }

    private resetTimer() {
        this.stopTimer();
        this.startTimer();
    }

    onTouchStart(e: TouchEvent) {
        this.touchEnd = null;
        this.touchStart = e.targetTouches[0].clientX;
    }

    onTouchMove(e: TouchEvent) {
        this.touchEnd = e.targetTouches[0].clientX;
    }

    onTouchEnd() {
        if (!this.touchStart || !this.touchEnd) return;
        const distance = this.touchStart - this.touchEnd;
        const isLeftSwipe = distance > this.minSwipeDistance;
        const isRightSwipe = distance < -this.minSwipeDistance;

        if (isLeftSwipe) {
            this.handleNext();
        } else if (isRightSwipe) {
            this.handlePrev();
        }
        this.resetTimer();
    }
}
