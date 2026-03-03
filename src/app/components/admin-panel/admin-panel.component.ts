
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ApiService } from '../../services/api.service';
import { Product, BlogPost, Category, AppData } from '../../models/types';

type AdminPage = 'Home Page' | 'About Us' | 'Contact Info' | 'Products' | 'Categories' | 'Blog Posts';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-sans relative">
      <!-- Security Overlay -->
      @if (!isAuthenticated()) {
        <div class="fixed inset-0 z-[1000] bg-brand-darkest/40 backdrop-blur-3xl flex items-center justify-center p-6 overflow-hidden">
          <div class="absolute inset-0 opacity-10 bg-[url('https://yogisafe.com/wp-content/uploads/2022/12/YS-Pattern-New.jpg')] bg-repeat"></div>
          
          <div class="w-full max-w-md relative z-10 animate-reveal">
            <div class="glass rounded-[48px] shadow-3xl p-10 md:p-12 border border-white/40">
              <div class="text-center mb-10">
                <div class="w-20 h-20 bg-brand-darkest rounded-[28px] flex items-center justify-center text-white mx-auto mb-6 shadow-2xl">
                  <i class="fas fa-shield-halved text-3xl"></i>
                </div>
                <h2 class="text-2xl font-black text-brand-darkest uppercase italic tracking-tighter mb-2">Secure Command</h2>
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-brand-primary">Authentication Required</p>
              </div>

              <div class="space-y-6">
                <div>
                  <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Access Key</label>
                  <div class="relative">
                    <i class="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                    <input 
                      type="password" 
                      [(ngModel)]="loginKey" 
                      (keyup.enter)="handleLogin()"
                      class="w-full bg-white/50 border border-slate-200/50 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all"
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                @if (loginError()) {
                  <p class="text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-shake">{{ loginError() }}</p>
                }

                <button 
                  (click)="handleLogin()"
                  class="w-full bg-brand-darkest text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-black transition-all active:scale-95 shadow-xl flex items-center justify-center gap-3"
                >
                  Authorize Entry <i class="fas fa-chevron-right text-[10px]"></i>
                </button>
              </div>
              
              <div class="mt-10 text-center">
                <p class="text-[9px] font-black uppercase tracking-widest text-slate-400">SafeSmart CMS Engine v2.4.0</p>
              </div>
            </div>
          </div>
        </div>
      }

      @if (feedback()) {
        <div [class]="'fixed top-6 right-6 z-[500] px-6 py-4 rounded-xl shadow-2xl font-black text-[10px] uppercase tracking-widest animate-fade-in border flex items-center gap-3 ' + (feedback()?.type === 'success' ? 'glass text-green-600 border-green-100' : 'glass text-red-600 border-red-100')">
          <i [class]="'fas fa-' + (feedback()?.type === 'success' ? 'check-circle' : 'exclamation-circle')"></i>
          {{ feedback()?.msg }}
        </div>
      }

      @if (isProcessingImage()) {
        <div class="fixed inset-0 z-[600] bg-brand-darkest/60 backdrop-blur-md flex items-center justify-center">
          <div class="text-center text-white">
            <div class="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p class="font-black uppercase tracking-widest text-[10px]">Processing High-Res Asset...</p>
          </div>
        </div>
      }

      <aside class="w-full lg:w-80 glass-dark text-white flex flex-col sticky top-0 lg:h-screen z-50 shadow-2xl border-none">
        <div class="p-10 border-b border-white/5">
          <div class="flex items-center gap-4 mb-10">
            <div class="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
              <i class="fas fa-shield-halved text-xl"></i>
            </div>
            <div>
              <h2 class="text-xl font-black italic tracking-tighter leading-none text-white">CMS ENGINE</h2>
              <span class="text-[9px] text-brand-primary font-black uppercase tracking-[0.3em]">SafeSmart Security</span>
            </div>
          </div>
          
          <nav class="space-y-2">
            @for (tab of tabs; track tab) {
              <button
                (click)="activeTab.set(tab)"
                [class]="'w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ' + (activeTab() === tab ? 'bg-brand-primary text-white shadow-2xl' : 'text-slate-400 hover:bg-white/5 hover:text-white')"
              >
                <i [class]="'fas fa-' + getTabIcon(tab) + ' text-sm'"></i>
                {{ tab }}
              </button>
            }
          </nav>
        </div>

        <div class="p-8 mt-auto space-y-4 bg-black/20">
          <div class="p-4 rounded-2xl bg-white/5 border border-white/5 mb-4">
             <div class="flex items-center gap-3 mb-2">
               <div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               <span class="text-[8px] font-black uppercase tracking-widest text-slate-400">System Secure</span>
             </div>
             <p class="text-[8px] text-slate-500 leading-relaxed font-bold">Automatic sync enabled for local staging preview.</p>
          </div>

          <button (click)="handleSavePreview()" [disabled]="isSaving()" class="w-full glass-dark text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-white/10 transition active:scale-95 disabled:opacity-50 shadow-sm flex items-center justify-center gap-2 border-white/5">
            <i class="fas fa-satellite-dish"></i> Cloud Sync
          </button>
          <button (click)="handleDeploy()" [disabled]="isDeploying()" class="w-full bg-brand-primary text-white py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:brightness-110 transition active:scale-95 disabled:opacity-50 shadow-xl flex items-center justify-center gap-2 border-none">
            <i class="fas fa-globe"></i> Go Live
          </button>
        </div>
      </aside>

      <div class="flex-grow flex flex-col min-w-0">
        <header class="h-20 glass border-b border-slate-200/50 px-12 flex items-center justify-between sticky top-0 z-40">
          <div class="flex items-center gap-4">
            <span class="w-2 h-8 bg-brand-primary rounded-full"></span>
            <h1 class="text-2xl font-black text-brand-darkest uppercase italic tracking-tighter">{{ activeTab() }}</h1>
          </div>
          
          <div class="flex items-center gap-6">
            <div class="hidden md:flex flex-col items-end mr-4">
              <span class="text-[9px] font-black text-brand-darkest uppercase tracking-widest leading-none mb-1">Administrator</span>
              <span class="text-[8px] font-bold text-green-500 uppercase tracking-widest">Active Session</span>
            </div>
            <button (click)="handleLogout()" class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center border border-slate-200/50">
              <i class="fas fa-power-off text-sm"></i>
            </button>
          </div>
        </header>

        <main class="p-8 md:p-12 overflow-y-auto bg-slate-50/50">
          <div class="max-w-5xl mx-auto pb-20">
            @if (!appData()) {
              <div class="flex flex-col items-center justify-center py-20 animate-reveal">
                <div class="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Decrypting Strategy Vault...</p>
              </div>
            } @else {
              <div class="glass rounded-[48px] shadow-3xl border border-white/60 p-10 md:p-16 relative overflow-hidden animate-reveal">
                 <div class="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>
              @if (activeTab() === 'Home Page') {
              <div class="space-y-16">
                <div>
                  <h3 class="text-[11px] font-black text-brand-darkest uppercase tracking-[0.4em] mb-10 border-l-8 border-brand-primary pl-6">Hero Dynamic Slideshow</h3>
                  <div class="space-y-8">
                    @for (slide of appData().content.home.hero.slides; track slide.id; let idx = $index) {
                      <div class="bg-slate-50/50 p-8 md:p-10 rounded-[40px] border border-slate-100 relative group hover:bg-white hover:shadow-2xl transition-all duration-500">
                        <button (click)="removeListItem('content.home.hero.slides', idx)" class="absolute top-6 right-6 text-red-400 hover:text-red-600 w-10 h-10 rounded-xl bg-white border flex items-center justify-center transition shadow-sm"><i class="fas fa-trash-alt"></i></button>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <input class="w-full bg-white p-4 rounded-xl text-sm font-bold border outline-none" placeholder="Headline" [(ngModel)]="slide.title" />
                          <input class="w-full bg-white p-4 rounded-xl text-sm border outline-none" placeholder="Sub-headline" [(ngModel)]="slide.subtitle" />
                          <div class="md:col-span-2">
                             <div class="flex gap-4 items-center">
                                <div class="w-20 h-20 bg-white border rounded-xl flex-shrink-0 overflow-hidden">
                                  @if (slide.image) { <img [src]="slide.image" class="w-full h-full object-cover" /> }
                                </div>
                                <div class="flex-grow">
                                  <label class="text-[9px] font-black uppercase tracking-widest mb-1 block opacity-50">Background Image</label>
                                  <input 
                                    type="file" 
                                    [id]="'home-slide-' + idx" 
                                    class="hidden" 
                                    (change)="onFileSelected($event, 'slide', idx)"
                                  />
                                  <label [htmlFor]="'home-slide-' + idx" class="w-full block bg-white p-4 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-300 text-center cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-all">Upload Asset</label>
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                    }
                    <button (click)="addSlide()" class="w-full py-8 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2"><i class="fas fa-plus-circle"></i> New Hero Frame</button>
                  </div>
                </div>
              </div>
            }

            @if (activeTab() === 'About Us') {
              <div class="space-y-12">
                <div class="space-y-8">
                  <div>
                    <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] mb-8 border-l-4 border-brand-primary pl-4">Hero Configuration</h3>
                    <div class="space-y-4">
                      <input class="w-full bg-gray-50 p-4 rounded-xl font-black text-xl border outline-none uppercase italic" placeholder="Hero Title" [(ngModel)]="appData().content.about.heroTitle" />
                      <textarea class="w-full bg-gray-50 p-4 rounded-xl text-sm border outline-none min-h-[100px]" placeholder="Hero Subtitle" [(ngModel)]="appData().content.about.heroSubtitle"></textarea>
                    </div>
                  </div>
                  
                  <div>
                    <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] mb-8 border-l-4 border-brand-primary pl-4">The Promise Section</h3>
                    <div class="space-y-4">
                      <input class="w-full bg-gray-50 p-4 rounded-xl font-black uppercase tracking-widest text-xs border outline-none" placeholder="Title" [(ngModel)]="appData().content.about.title" />
                      <input class="w-full bg-gray-50 p-4 rounded-xl text-sm border outline-none" placeholder="Subtitle" [(ngModel)]="appData().content.about.subtitle" />
                      <textarea class="w-full bg-gray-50 p-4 rounded-xl text-sm border outline-none min-h-[150px]" placeholder="Main Content Text" [(ngModel)]="appData().content.about.content"></textarea>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (activeTab() === 'Contact Info') {
              <div class="space-y-12">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div class="space-y-4">
                    <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] mb-4 border-l-4 border-brand-primary pl-4">Core Channels</h3>
                    <div class="space-y-4">
                      <div class="relative">
                         <i class="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                         <input class="w-full bg-gray-50 pl-12 pr-4 py-4 rounded-xl text-sm font-bold border outline-none" placeholder="Primary Email" [(ngModel)]="appData().content.contact.email" />
                      </div>
                      <div class="relative">
                         <i class="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                         <input class="w-full bg-gray-50 pl-12 pr-4 py-4 rounded-xl text-sm font-bold border outline-none" placeholder="Primary Phone" [(ngModel)]="appData().content.contact.phone" />
                      </div>
                      <div class="relative">
                         <i class="fas fa-phone-volume absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                         <input class="w-full bg-gray-50 pl-12 pr-4 py-4 rounded-xl text-sm font-bold border outline-none" placeholder="Secondary Phone" [(ngModel)]="appData().content.contact.phone2" />
                      </div>
                      <div class="relative">
                         <i class="fab fa-whatsapp absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                         <input class="w-full bg-gray-50 pl-12 pr-4 py-4 rounded-xl text-sm font-bold border outline-none" placeholder="WhatsApp Trigger" [(ngModel)]="appData().content.contact.whatsapp" />
                      </div>
                      <div class="relative">
                         <i class="fas fa-comment-dots absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                         <textarea class="w-full bg-gray-50 pl-12 pr-4 py-4 rounded-xl text-sm border outline-none min-h-[100px]" placeholder="Auto-Message (Professional)" [(ngModel)]="appData().content.contact.whatsappMessage"></textarea>
                      </div>
                    </div>
                  </div>
                  
                  <div class="space-y-4">
                    <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] mb-4 border-l-4 border-brand-primary pl-4">Geography</h3>
                    <textarea class="w-full bg-gray-50 p-4 rounded-xl text-sm border outline-none min-h-[140px]" placeholder="HQ Map Address" [(ngModel)]="appData().content.contact.address"></textarea>
                  </div>
                </div>
              </div>
            }

            @if (activeTab() === 'Categories') {
              <div class="space-y-8">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] border-l-4 border-brand-primary pl-4">Taxonomy Management</h3>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  @for (cat of appData().categories; track cat.id; let idx = $index) {
                    <div class="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center gap-4 group">
                      <div class="w-12 h-12 bg-white rounded-xl border flex items-center justify-center text-brand-primary">
                        <i [class]="'fas fa-' + cat.icon"></i>
                      </div>
                      <input class="flex-grow bg-transparent font-black uppercase tracking-widest text-[10px] outline-none" [(ngModel)]="cat.name" />
                      <button (click)="removeListItem('categories', idx)" class="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition-all"><i class="fas fa-times-circle"></i></button>
                    </div>
                  }
                </div>
                <button (click)="addCategory()" class="w-full py-6 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:border-brand-primary hover:text-brand-primary transition-all">Append Classification</button>
              </div>
            }

            @if (activeTab() === 'Blog Posts') {
              <div class="space-y-8">
                <div class="flex items-center justify-between">
                  <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] border-l-4 border-brand-primary pl-4">Intelligence Archive</h3>
                </div>
                <div class="space-y-4">
                  @for (post of appData().blogs; track post.id; let idx = $index) {
                    <div class="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-xl transition-all">
                      <div class="flex items-center gap-6">
                        <div class="w-16 h-10 bg-gray-200 rounded-lg overflow-hidden">
                           <img [src]="post.image" class="w-full h-full object-cover" />
                        </div>
                        <div>
                          <input class="bg-transparent font-black text-brand-darkest uppercase italic tracking-tighter text-sm outline-none border-b border-transparent focus:border-brand-primary" [(ngModel)]="post.title" />
                          <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">{{ post.author }} • {{ post.date }}</p>
                        </div>
                      </div>
                      <button (click)="removeListItem('blogs', idx)" class="w-10 h-10 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex items-center justify-center"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                  }
                  <button (click)="addBlogPost()" class="w-full py-8 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-3"><i class="fas fa-plus-circle"></i> New Intelligence Brief</button>
                </div>
              </div>
            }

            @if (activeTab() === 'Products') {
              <div class="flex items-center justify-between mb-8">
                <div>
                  <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] mb-2 border-l-4 border-brand-primary pl-4">Inventory Control</h3>
                  <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Manage high-security vault specifications</p>
                </div>
                <button 
                  (click)="addNewRecord()"
                  class="bg-brand-primary text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-brand-dark transition-all flex items-center gap-2"
                >
                  <i class="fas fa-plus"></i> New Safe
                </button>
              </div>

              <div class="grid grid-cols-1 gap-4">
                @for (p of products(); track p.id) {
                  <div class="flex items-center justify-between p-8 bg-gray-50 rounded-[32px] border border-gray-100 hover:bg-white transition-all group shadow-sm hover:shadow-2xl hover:scale-[1.01] relative overflow-hidden">
                    <div class="absolute top-0 left-0 w-1 h-full bg-brand-primary opacity-0 group-hover:opacity-100 transition-all"></div>
                    <div class="flex items-center gap-8">
                      <div class="w-20 h-20 bg-white rounded-2xl overflow-hidden border border-gray-100 p-3 flex items-center justify-center shadow-inner">
                        <img [src]="p.image || 'https://via.placeholder.com/150'" class="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500" />
                      </div>
                      <div>
                        <div class="flex items-center gap-3 mb-1">
                          <h4 class="font-black text-brand-darkest text-base uppercase italic tracking-tighter">{{ p.name }}</h4>
                          <span class="px-2 py-0.5 bg-brand-primary/10 text-brand-primary text-[8px] font-black uppercase tracking-widest rounded-md">{{ p.weight || 'No Weight' }}</span>
                        </div>
                        <span class="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                          <i class="fas fa-layer-group text-brand-primary/40"></i> {{ p.category }}
                        </span>
                      </div>
                    </div>
                    <div class="flex gap-3">
                       <button (click)="editingProduct.set(p)" class="w-12 h-12 rounded-[18px] bg-white border border-gray-100 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm flex items-center justify-center">
                         <i class="fas fa-pen-nib text-xs"></i>
                       </button>
                       <button (click)="removeProduct(p.id)" class="w-12 h-12 rounded-[18px] bg-white border border-gray-100 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center">
                         <i class="fas fa-trash-can text-xs"></i>
                       </button>
                    </div>
                  </div>
                }
              </div>
            }
            </div>
            }
          </div>
        </main>

      <!-- Edit Modal - Unified approach for brevity -->
      @if (editingProduct()) {
        <div class="fixed inset-0 bg-brand-darkest/60 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-fade-in">
           <div class="bg-white w-full max-w-2xl rounded-[48px] shadow-3xl overflow-hidden animate-reveal border border-white/20">
              <div class="bg-gray-50 px-12 py-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 class="font-black text-brand-darkest uppercase tracking-widest text-[10px] mb-1">Entity Modification</h3>
                  <p class="text-[9px] text-brand-primary font-black uppercase tracking-widest">Secure Update Interface</p>
                </div>
                <button (click)="editingProduct.set(null)" class="w-10 h-10 rounded-xl hover:bg-white transition-all text-gray-400 flex items-center justify-center border border-transparent hover:border-gray-100">
                  <i class="fas fa-times text-xs"></i>
                </button>
              </div>

              <div class="p-12 space-y-8">
                <div class="space-y-4">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Asset Nomenclature</label>
                  <input class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all shadow-inner" [(ngModel)]="editingProduct()!.name" placeholder="Formal Identification" />
                </div>
                
                <div class="grid grid-cols-2 gap-6">
                  <div class="space-y-4">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Current Classification</label>
                    <select class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingProduct()!.category">
                      @for (cat of appData().categories; track cat.id) {
                        <option [value]="cat.name">{{ cat.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="space-y-4">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Technical Mass</label>
                    <input class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingProduct()!.weight" placeholder="Approx Weight" />
                  </div>
                </div>

                <div class="space-y-4">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Asset Management</label>
                  <div class="flex gap-4 items-center">
                    <div class="w-20 h-20 bg-gray-50 border rounded-2xl overflow-hidden flex-shrink-0">
                      @if (editingProduct()!.image) { <img [src]="editingProduct()!.image" class="w-full h-full object-cover" /> }
                    </div>
                    <div class="flex-grow">
                      <input type="file" id="product-img-upload" class="hidden" (change)="onFileSelected($event, 'product')" />
                      <label htmlFor="product-img-upload" class="w-full block bg-gray-50 p-4 rounded-xl text-[9px] font-black uppercase tracking-widest border border-dashed border-gray-300 text-center cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-all">Upload Technical Image</label>
                    </div>
                  </div>
                </div>

                <div class="flex gap-4 pt-4">
                  <button (click)="saveProduct()" class="flex-grow bg-brand-darkest text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all active:scale-95 shadow-xl">
                    Commit Changes
                  </button>
                  <button (click)="editingProduct.set(null)" class="px-8 bg-gray-50 text-gray-400 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:text-gray-600 transition-all border border-gray-100">
                    Abort
                  </button>
                </div>
              </div>
           </div>
        </div>
      }

    </div>
  `,
  styles: []
})
export class AdminPanelComponent implements OnInit {
  tabs: AdminPage[] = ['Home Page', 'About Us', 'Contact Info', 'Products', 'Categories', 'Blog Posts'];
  activeTab = signal<AdminPage>('Home Page');

  // Security & Authentication
  isAuthenticated = signal(localStorage.getItem('admin_authenticated') === 'true');
  loginKey = '';
  loginError = signal('');

  // Reactive local state for editing
  appData = signal<AppData>(null as any);
  products = computed(() => this.appData()?.products || []);

  feedback = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  isProcessingImage = signal(false);
  isSaving = signal(false);
  isDeploying = signal(false);

  editingProduct = signal<Product | null>(null);

  constructor(
    private dataService: DataService,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    // If we're authenticated, we need data to edit.
    // We listen to the DataService signal to ensure we get the latest data even if it loads late.
    const currentData = this.dataService.getAppData();
    if (currentData) {
      this.appData.set(JSON.parse(JSON.stringify(currentData)));
    }
  }

  handleLogin() {
    const MASTER_KEY = 'SafeSmart2025@Gondal';
    if (this.loginKey === MASTER_KEY) {
      this.isAuthenticated.set(true);
      localStorage.setItem('admin_authenticated', 'true');
      this.showFeedback('Command Authorization Successful');

      // Refresh local data copy on successful login
      const currentData = this.dataService.getAppData();
      if (currentData) {
        this.appData.set(JSON.parse(JSON.stringify(currentData)));
      }
    } else {
      this.loginError.set('Invalid Security Key. Unauthorized Access Flagged.');
      setTimeout(() => this.loginError.set(''), 3000);
    }
  }

  handleLogout() {
    this.isAuthenticated.set(false);
    localStorage.removeItem('admin_authenticated');
  }

  async syncToPreview() {
    // This provides the "Real-Time" feel by updating the DataService instantly
    // which components like AppComponent use for the Staging view.
    this.dataService.updateAppData(this.appData());
  }

  getTabIcon(tab: AdminPage): string {
    switch (tab) {
      case 'Home Page': return 'home';
      case 'About Us': return 'id-card';
      case 'Contact Info': return 'headset';
      case 'Products': return 'vault';
      case 'Categories': return 'layer-group';
      case 'Blog Posts': return 'pen-fancy';
    }
  }

  showFeedback(msg: string, type: 'success' | 'error' = 'success') {
    this.feedback.set({ msg, type });
    setTimeout(() => this.feedback.set(null), 3000);
  }

  async handleSavePreview() {
    this.isSaving.set(true);
    const success = await this.apiService.savePreview(this.appData());
    this.isSaving.set(false);
    if (success) {
      this.showFeedback('Cloud Preview Synced');
      this.syncToPreview();
    } else {
      this.showFeedback('Cloud Sync Failed! Server may be offline.', 'error');
    }
  }

  async handleDeploy() {
    if (!confirm('Deploy changes to production environment? This will overwrite the live site.')) return;
    this.isDeploying.set(true);
    const success = await this.apiService.deploy();
    this.isDeploying.set(false);
    if (success) {
      this.showFeedback('Production site updated');
    } else {
      this.showFeedback('Deployment failed! Server error.', 'error');
    }
  }

  removeListItem(path: string, idx: number) {
    const data = this.appData();
    if (path === 'content.home.hero.slides') {
      data.content.home.hero.slides.splice(idx, 1);
    } else if (path === 'categories') {
      data.categories.splice(idx, 1);
    } else if (path === 'blogs') {
      data.blogs.splice(idx, 1);
    }
    this.appData.set({ ...data });
  }

  addCategory() {
    const data = this.appData();
    data.categories.push({ id: `c-${Date.now()}`, name: 'New Category', icon: 'vault', image: '' });
    this.appData.set({ ...data });
  }

  addBlogPost() {
    const data = this.appData();
    data.blogs.push({
      id: `b-${Date.now()}`,
      title: 'New Intelligence Update',
      excerpt: 'Short summary...',
      content: 'Full article content...',
      date: new Date().toLocaleDateString(),
      author: 'Security Lead',
      image: '',
      slug: `new-blog-${Date.now()}`
    });
    this.appData.set({ ...data });
  }

  addSlide() {
    const data = this.appData();
    data.content.home.hero.slides.push({ id: `s-${Date.now()}`, title: 'New Story', subtitle: '...', image: '', cta: 'Explore', ctaLink: '/category/all' });
    this.appData.set({ ...data });
  }

  addNewRecord() {
    const newProduct: Product = {
      id: `p-${Date.now()}`,
      name: 'New Security Safe',
      category: 'Fire & Burglar Safes',
      description: 'New product description...',
      price: 'Contact for Quote',
      image: '',
      features: [],
      specifications: []
    };
    this.editingProduct.set(newProduct);
  }

  removeProduct(id: string) {
    if (!confirm('Delete?')) return;
    const data = this.appData();
    data.products = data.products.filter(p => p.id !== id);
    this.appData.set({ ...data });
  }

  saveProduct() {
    const p = this.editingProduct();
    if (p) {
      const data = this.appData();
      const idx = data.products.findIndex(it => it.id === p.id);
      if (idx > -1) data.products[idx] = p;
      else data.products.push(p);
      this.appData.set({ ...data });
      this.editingProduct.set(null);
    }
  }

  async onFileSelected(event: any, type: string, idx?: number) {
    const file = event.target.files[0];
    if (file) {
      this.isProcessingImage.set(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const data = this.appData();

        if (type === 'slide' && idx !== undefined) {
          data.content.home.hero.slides[idx].image = url;
        } else if (type === 'product' && this.editingProduct()) {
          this.editingProduct.set({ ...this.editingProduct()!, image: url });
        } else if (type === 'blog' && idx !== undefined) {
          data.blogs[idx].image = url;
        } else if (type === 'category' && idx !== undefined) {
          data.categories[idx].image = url;
        }

        this.appData.set({ ...data });
        this.isProcessingImage.set(false);
      };
      reader.readAsDataURL(file);
    }
  }
}
