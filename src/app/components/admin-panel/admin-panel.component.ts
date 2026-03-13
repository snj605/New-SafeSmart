
import { Component, OnInit, signal, computed, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ApiService } from '../../services/api.service';
import { Product, BlogPost, Category, AppData } from '../../models/types';
import { processImageForUpload } from '../../shared/utils/image-utils';

type AdminPage = 'Home Page' | 'About Us' | 'Contact Info' | 'Products' | 'Categories' | 'Blog Posts' | 'Inquiries' | 'Admin Management' | 'Profile';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans relative">
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
                  <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Identity Username</label>
                  <div class="relative">
                    <i class="fas fa-user absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                    <input
                      type="text"
                      [(ngModel)]="username"
                      class="w-full bg-white/50 border border-slate-200/50 rounded-2xl py-4 pl-12 pr-6 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all"
                      placeholder="e.g. john_doe"
                    />
                  </div>
                </div>

                <div>
                  <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Access PIN / Password</label>
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

      <!-- Sidebar Overlay -->
      @if (isSidebarOpen()) {
        <div (click)="toggleSidebar()" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] animate-fade-in"></div>
      }

      <aside [class]="'w-[80%] md:w-80 lg:w-80 glass-dark text-white flex flex-col fixed top-0 h-screen z-50 shadow-2xl border-none transition-all duration-500 ease-in-out overflow-y-auto ' + (isSidebarOpen() ? 'translate-x-0' : '-translate-x-full')">
        <div class="p-8 lg:p-10 border-b border-white/5">
          <div class="flex items-center gap-4 mb-10">
            <div class="w-10 h-10 lg:w-12 lg:h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white shadow-lg">
              <i class="fas fa-shield-halved text-lg lg:text-xl"></i>
            </div>
            <div>
              <h2 class="text-lg lg:text-xl font-black italic tracking-tighter leading-none text-white uppercase">CMS ENGINE</h2>
              <span class="text-[8px] lg:text-[9px] text-brand-primary font-black uppercase tracking-[0.3em]">SafeSmart Security</span>
            </div>
          </div>
          
          <nav class="space-y-1.5">
            @for (tab of visibleTabs(); track tab) {
              <button
                (click)="activeTab.set(tab); isSidebarOpen.set(false)"
                [class]="'w-full flex items-center gap-4 px-5 py-3.5 lg:px-6 lg:py-4 rounded-2xl text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ' + (activeTab() === tab ? 'bg-brand-primary text-white shadow-2xl' : 'text-slate-400 hover:bg-white/5 hover:text-white')"
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
        <header class="h-20 lg:h-20 bg-white lg:glass border-b border-slate-200/50 px-6 lg:px-12 flex items-center justify-between sticky top-0 z-40">
          <div class="flex items-center gap-4">
            <button (click)="toggleSidebar()" class="w-10 h-10 rounded-xl bg-slate-100 text-slate-400 hover:text-brand-primary flex items-center justify-center transition-all lg:mr-2">
              <i class="fas fa-bars"></i>
            </button>
            <span class="hidden md:block w-1.5 h-6 lg:w-2 lg:h-8 bg-brand-primary rounded-full"></span>
            <h1 class="text-lg lg:text-2xl font-black text-brand-darkest uppercase italic tracking-tighter truncate max-w-[150px] md:max-w-none">{{ activeTab() }}</h1>
          </div>
          
          <div class="flex items-center gap-6">
            <div class="hidden md:flex flex-col items-end mr-4">
              <span class="text-[9px] font-black text-brand-darkest uppercase tracking-widest leading-none mb-1">{{ userRole() === 'super_admin' ? 'Super Admin' : 'Staff Admin' }}</span>
              <span class="text-[8px] font-bold text-green-500 uppercase tracking-widest">{{ userFullName() }}</span>
            </div>
            <button (click)="handleLogout()" class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center border border-slate-200/50">
              <i class="fas fa-power-off text-sm"></i>
            </button>
          </div>
        </header>

        <main class="p-6 md:p-12 overflow-y-auto bg-slate-50/50">
          <div class="max-w-5xl mx-auto pb-20">
            @if (!appData()) {
              <div class="flex flex-col items-center justify-center py-20 animate-reveal">
                <div class="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Decrypting Strategy Vault...</p>
              </div>
            }
            @else {
              <div class="glass rounded-[32px] md:rounded-[48px] shadow-3xl border border-white/60 p-6 md:p-16 relative overflow-hidden animate-reveal">
                <div class="absolute top-0 right-0 w-96 h-96 bg-brand-primary/5 rounded-full blur-[100px] -mr-48 -mt-48"></div>

                @if (activeTab() === 'Profile') {
                  <div class="space-y-10 animate-reveal">
                    <div class="flex items-center gap-6 mb-8">
                       <div class="w-24 h-24 bg-brand-primary/10 rounded-[32px] flex items-center justify-center text-brand-primary border-2 border-brand-primary/20 shadow-inner">
                         <i class="fas fa-user-shield text-4xl"></i>
                       </div>
                       <div>
                         <h2 class="text-3xl font-black text-brand-darkest uppercase italic tracking-tighter">My Secure Profile</h2>
                         <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Manage your administrative identity</p>
                       </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div class="space-y-6">
                            <div>
                                <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Full Name</label>
                                <input [ngModel]="userFullName()" (ngModelChange)="userFullName.set($event)" class="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm" />
                            </div>
                            <div>
                                <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Email Address</label>
                                <input type="email" placeholder="admin@example.com" class="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm" />
                            </div>
                            <div>
                                <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Contact Phone</label>
                                <input type="tel" placeholder="+91 ..." class="w-full bg-white border border-slate-200 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm" />
                            </div>
                        </div>
                        <div class="space-y-6">
                            <div class="p-8 rounded-[40px] bg-brand-primary/5 border border-brand-primary/10">
                                <h4 class="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-6 flex items-center gap-2">
                                    <i class="fas fa-key"></i> Security Credentials
                                </h4>
                                <div class="space-y-4">
                                    <label class="block text-[9px] font-bold text-slate-500 uppercase tracking-widest">Update Password</label>
                                    <input type="password" placeholder="New complexity password..." class="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 outline-none focus:ring-2 focus:ring-brand-primary text-sm" />
                                    <p class="text-[8px] text-slate-400 font-bold leading-relaxed italic mt-2 text-right">Leave blank to keep existing password.</p>
                                </div>
                            </div>

                            <button (click)="updateProfile()" class="w-full bg-brand-darkest text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all active:scale-95 shadow-xl mt-4">
                                Commit Profile Updates
                            </button>
                        </div>
                    </div>
                  </div>
                }

                @if (activeTab() === 'Admin Management') {
                   <div class="space-y-10 animate-reveal">
                      <div class="flex justify-between items-center mb-8">
                         <div>
                            <h2 class="text-3xl font-black text-brand-darkest uppercase italic tracking-tighter">Strategic Access Control</h2>
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Manage sub-admin privileges and roles</p>
                         </div>
                         <button (click)="openAddAdminModal()" class="bg-brand-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:brightness-110 shadow-2xl shadow-brand-primary/20 flex items-center gap-3">
                           <i class="fas fa-user-plus text-xs"></i> Enroll New Admin
                         </button>
                      </div>

                      <div class="grid gap-4">
                         @for (admin of adminList(); track admin._id) {
                            <div class="flex items-center justify-between p-6 bg-white border border-slate-100 rounded-[32px] hover:shadow-lg transition-all">
                               <div class="flex items-center gap-6">
                                  <div [class]="'w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black ' + (admin.role === 'super_admin' ? 'bg-orange-500 shadow-orange-200' : 'bg-brand-primary shadow-brand-100')">
                                    {{ admin.username[0] | uppercase }}
                                  </div>
                                  <div>
                                     <div class="text-[11px] font-black uppercase tracking-tight text-slate-900 group-hover:text-brand-primary transition-colors">{{ admin.fullName }} <span class="text-[8px] opacity-40 lowercase ml-2">&#64;{{ admin.username }}</span></div>
                                     <div class="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                        <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><i class="fas fa-id-badge text-[7px]"></i> {{ admin.role === 'super_admin' ? 'Strategic Command' : 'Staff Admin' }}</span>
                                        <span class="text-[8px] font-black uppercase tracking-widest text-slate-300">|</span>
                                        <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><i class="fas fa-envelope text-[7px]"></i> {{ admin.email }}</span>
                                        @if (admin.phone) {
                                          <span class="text-[8px] font-black uppercase tracking-widest text-slate-300">|</span>
                                          <span class="text-[8px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1"><i class="fas fa-phone text-[7px]"></i> {{ admin.phone }}</span>
                                        }
                                     </div>
                                     <div class="flex flex-wrap gap-1 mt-2">
                                        @for (p of admin.permissions; track p) {
                                          <span class="px-2 py-0.5 bg-slate-50 border border-slate-100 text-[7px] font-black uppercase tracking-tighter text-slate-400 rounded-md">{{ p }}</span>
                                        }
                                     </div>
                                  </div>
                               </div>
                               <div class="flex gap-2">
                                  <button (click)="editAdmin(admin)" class="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 hover:text-brand-primary hover:bg-slate-100 transition flex items-center justify-center">
                                    <i class="fas fa-edit text-xs"></i>
                                  </button>
                                  <button *ngIf="admin.role !== 'super_admin'" (click)="deleteAdmin(admin._id)" class="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition flex items-center justify-center">
                                    <i class="fas fa-trash text-xs"></i>
                                  </button>
                               </div>
                            </div>
                         }
                      </div>

                      @if (adminList().length === 0) {
                         <div class="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                            <i class="fas fa-users-slash text-slate-200 text-6xl mb-6"></i>
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">No alternate admin units detected in system.</p>
                         </div>
                      }
                   </div>
                }

                @if (activeTab() === 'Inquiries') {
                  <div class="space-y-8 animate-reveal">
                    <!-- Inquiry Header & Intelligence controls -->
                    <div class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
                      <div class="space-y-2">
                        <h2 class="text-3xl lg:text-4xl font-black text-brand-darkest uppercase italic tracking-tighter leading-none">Lead Intelligence</h2>
                        <div class="flex items-center flex-wrap gap-4">
                          <span class="flex items-center gap-2 text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-slate-400">
                             <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Data Sync Active
                          </span>
                          <span class="hidden md:block w-1 h-1 rounded-full bg-slate-200"></span>
                          <span class="text-[9px] lg:text-[10px] font-black uppercase tracking-widest text-brand-primary">
                            {{ inquiries().length }} Strategic Leads Located
                          </span>
                        </div>
                      </div>

                      <div class="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full lg:w-auto">
                        <div class="bg-slate-100/60 p-1.5 rounded-2xl flex items-center border border-slate-100/50 backdrop-blur-sm">
                          @for (f of ['All', 'New', 'Contacted', 'Resolved']; track f) {
                            <button (click)="inquiryFilter.set($any(f)); inquiryPage.set(1)"
                                    [class]="'flex-grow md:flex-none px-4 lg:px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ' + (inquiryFilter() === f ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-slate-600')">
                              {{ f }}
                            </button>
                          }
                        </div>
                        <button (click)="exportInquiriesToExcel()" class="bg-brand-darkest text-white px-7 py-4 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-black transition active:scale-95 flex items-center justify-center gap-3 shadow-2xl shadow-black/10">
                          <i class="fas fa-file-export italic"></i> Strategic Export
                        </button>
                      </div>
                    </div>

                    <!-- Bulk Actions -->
                    @if (selectedInquiryIds().length > 0) {
                      <div class="bg-brand-primary/5 border border-brand-primary/10 p-5 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 animate-reveal mb-8">
                        <div class="flex items-center gap-4 w-full md:w-auto">
                           <div class="w-10 h-10 rounded-2xl bg-brand-primary text-white flex items-center justify-center text-sm font-black shadow-lg shadow-brand-primary/30">{{ selectedInquiryIds().length }}</div>
                           <span class="text-[10px] font-black uppercase tracking-widest text-brand-primary">Entities Selected for Protocol</span>
                        </div>
                        <div class="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                           <button (click)="handleBulkAction('markContacted')" class="flex-grow md:flex-none bg-white text-blue-600 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100 hover:bg-blue-50 transition shadow-sm">Log Contact</button>
                           <button (click)="handleBulkAction('markResolved')" class="flex-grow md:flex-none bg-white text-green-600 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-green-100 hover:bg-green-50 transition shadow-sm">Resolve</button>
                           <button (click)="handleBulkAction('delete')" class="flex-grow md:flex-none bg-white text-red-600 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-red-100 hover:bg-red-50 transition shadow-sm">Purge</button>
                           <button (click)="selectedInquiryIds.set([])" class="w-12 h-12 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition bg-slate-50">
                             <i class="fas fa-times"></i>
                           </button>
                        </div>
                      </div>
                    }

                    @if (isLoadingInquiries()) {
                      <div class="flex flex-col items-center justify-center py-32 bg-slate-50/50 rounded-[40px] border border-slate-100 border-dashed">
                        <div class="w-16 h-16 border-4 border-brand-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing lead intelligence...</p>
                      </div>
                    } @else {
                      <!-- Desktop High-Fidelity Table (Visible on Large Screens) -->
                      <div class="hidden lg:block bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden animate-reveal">
                        <div class="overflow-x-auto">
                          <table class="w-full">
                            <thead>
                              <tr class="bg-slate-50/50 border-b border-slate-100">
                                <th class="px-6 py-6 text-left w-12">
                                  <input type="checkbox" (change)="toggleAllSelection()" [checked]="selectedInquiryIds().length === paginatedInquiries().length && paginatedInquiries().length > 0" class="rounded border-slate-200 text-brand-primary focus:ring-brand-primary" />
                                </th>
                                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Entity ID</th>
                                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Topic Payload</th>
                                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Secure Line</th>
                                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Inquiry Status</th>
                                <th class="px-6 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-left">Timestamp</th>
                                <th class="px-6 py-6 text-right"></th>
                              </tr>
                            </thead>
                            <tbody>
                              @for (item of paginatedInquiries(); track item._id) {
                                <tr class="group hover:bg-slate-50/50 transition-colors border-t border-slate-50">
                                  <td class="px-6 py-8">
                                    <input type="checkbox" (change)="toggleSelection(item._id)" [checked]="selectedInquiryIds().includes(item._id)" class="rounded border-slate-200 text-brand-primary focus:ring-brand-primary" />
                                  </td>
                                  <td class="px-6 py-8">
                                    <div class="flex items-center gap-4">
                                      <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs">
                                        {{ (item.name[0] || 'U') | uppercase }}
                                      </div>
                                      <div>
                                        <div class="text-[11px] font-black uppercase tracking-tight text-slate-900">{{ item.name }}</div>
                                        <div class="text-[9px] text-slate-400 lowercase">{{ item.email }}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td class="px-6 py-8">
                                    <div class="text-[11px] font-bold text-slate-600 line-clamp-1 max-w-[200px]">{{ item.subject || 'N/A' }}</div>
                                  </td>
                                  <td class="px-6 py-8">
                                    <div class="text-xs font-bold text-slate-600">{{ item.phone || 'No phone' }}</div>
                                  </td>
                                  <td class="px-6 py-8">
                                    <div [class]="'px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest inline-block ' + (item.status === 'Resolved' ? 'bg-green-100 text-green-600' : (item.status === 'Contacted' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'))">
                                      {{ item.status || 'New' }}
                                    </div>
                                  </td>
                                  <td class="px-6 py-8">
                                    <div class="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                      {{ getTimeAgo(item.createdAt) }}
                                    </div>
                                    <div class="text-[8px] opacity-40">{{ item.createdAt | date:'MMM d, HH:mm' }}</div>
                                  </td>
                                  <td class="px-6 py-8 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                      <select (change)="updateInquiryStatus(item._id, $any($event.target).value)"
                                              class="bg-slate-50 border-none text-[8px] font-black uppercase tracking-widest rounded-lg px-2 py-2 outline-none focus:ring-1 focus:ring-brand-primary">
                                        <option [selected]="!item.status || item.status === 'New'">New</option>
                                        <option [selected]="item.status === 'Contacted'">Contacted</option>
                                        <option [selected]="item.status === 'Resolved'">Resolved</option>
                                      </select>
                                      <button (click)="toggleExpand(item._id)" [class]="'w-10 h-10 rounded-xl flex items-center justify-center transition ' + (expandedInquiryId() === item._id ? 'bg-brand-primary text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-brand-primary hover:text-white')">
                                        <i class="fas" [class.fa-eye]="expandedInquiryId() !== item._id" [class.fa-eye-slash]="expandedInquiryId() === item._id"></i>
                                      </button>
                                      <button (click)="deleteInquiry(item._id)" class="w-10 h-10 rounded-xl bg-red-50 text-red-400 hover:bg-red-500 hover:text-white transition flex items-center justify-center">
                                        <i class="fas fa-trash text-xs"></i>
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                                @if (expandedInquiryId() === item._id) {
                                  <tr class="bg-slate-50/50">
                                    <td colspan="7" class="px-10 py-10">
                                      <div class="animate-reveal grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div class="space-y-6">
                                          <div class="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm relative overflow-hidden">
                                            <div class="absolute top-0 left-0 w-2 h-full bg-brand-primary"></div>
                                            <div class="flex items-center gap-3 mb-4">
                                              <i class="fas fa-quote-left text-brand-primary/20 text-xl"></i>
                                              <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inquiry Message</h4>
                                            </div>
                                            <p class="text-[13px] text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{{ item.message }}</p>
                                          </div>

                                          <div class="flex flex-wrap gap-3">
                                            <button (click)="updateInquiryStatus(item._id, 'Contacted')" class="flex-grow bg-blue-500 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-blue-600 transition active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2">
                                              <i class="fas fa-headset"></i> Log Contact
                                            </button>
                                            <button (click)="updateInquiryStatus(item._id, 'Resolved')" class="flex-grow bg-green-500 text-white py-4 px-6 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-green-600 transition active:scale-95 shadow-xl shadow-green-500/20 flex items-center justify-center gap-2">
                                              <i class="fas fa-check-double"></i> Resolve
                                            </button>
                                            <button (click)="deleteInquiry(item._id)" class="bg-red-50 text-red-500 w-14 h-14 rounded-2xl flex items-center justify-center hover:bg-red-500 hover:text-white transition shadow-sm border border-red-100">
                                              <i class="fas fa-trash-alt"></i>
                                            </button>
                                          </div>
                                        </div>

                                        <div class="bg-white rounded-[32px] p-8 border border-slate-100 shadow-sm space-y-6">
                                          <h4 class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <i class="fas fa-id-card text-brand-primary text-xs"></i> Sender Intelligence
                                          </h4>
                                          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                              <div class="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Full Name</div>
                                              <div class="text-xs font-black text-slate-700 uppercase italic tracking-tighter">{{ item.name }}</div>
                                            </div>
                                            <div>
                                              <div class="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Secure Line</div>
                                              <div class="text-xs font-bold text-slate-600">{{ item.phone || 'N/A' }}</div>
                                            </div>
                                            <div class="col-span-2">
                                              <div class="text-[9px] font-black uppercase text-slate-300 tracking-[0.2em] mb-1">Communication Endpoint</div>
                                              <div class="text-xs font-bold text-brand-primary">{{ item.email }}</div>
                                            </div>
                                            <div class="col-span-2 pt-4 border-t border-slate-50">
                                              <div class="flex items-center justify-between">
                                                <div class="space-y-1">
                                                   <div class="text-[8px] font-black uppercase text-slate-300 tracking-widest">Entry Timestamp</div>
                                                   <div class="text-[10px] font-bold text-slate-500">{{ item.createdAt | date:'medium' }}</div>
                                                </div>
                                                @if (item.lastFollowUpAt) {
                                                  <div class="space-y-1 text-right">
                                                    <div class="text-[8px] font-black uppercase text-slate-300 tracking-widest">Last Intelligence Sync</div>
                                                    <div class="text-[10px] font-bold text-slate-500">{{ item.lastFollowUpAt | date:'medium' }}</div>
                                                  </div>
                                                }
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                }
                              }
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <!-- Mobile Strategic Data View -->
                      <div class="lg:hidden space-y-4 animate-reveal">
                        @for (item of paginatedInquiries(); track item._id) {
                          <div class="bg-white rounded-[32px] p-6 border border-slate-100 shadow-sm relative overflow-hidden">
                             @if (item.status === 'New' || !item.status) {
                               <div class="absolute top-0 right-0 w-1.5 h-full bg-red-400"></div>
                             }

                             <div class="flex items-center justify-between mb-5">
                                <div class="flex items-center gap-3">
                                   <input type="checkbox" (change)="toggleSelection(item._id)" [checked]="selectedInquiryIds().includes(item._id)" class="rounded border-slate-200 text-brand-primary focus:ring-brand-primary" />
                                   <div class="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] uppercase">
                                     {{ item.name[0] }}
                                   </div>
                                   <div class="truncate max-w-[130px]">
                                      <div class="text-[11px] font-black uppercase text-brand-darkest leading-none mb-1 break-all">{{ item.name }}</div>
                                      <div class="text-[8px] font-black text-slate-400 tracking-widest uppercase italic">{{ getTimeAgo(item.createdAt) }}</div>
                                   </div>
                                </div>
                                <div [class]="'px-3 py-1 rounded-full text-[7px] font-black uppercase tracking-widest ' + (item.status === 'Resolved' ? 'bg-green-100 text-green-600' : (item.status === 'Contacted' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'))">
                                  {{ item.status || 'New' }}
                                </div>
                             </div>

                             <div class="bg-slate-50/80 p-4 rounded-2xl border border-slate-100 mb-6">
                                <div class="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1.5 flex items-center gap-2">
                                   <i class="fas fa-radar text-brand-primary opacity-30"></i> Intelligence Payload
                                </div>
                                <div class="text-[10px] font-bold text-slate-700 leading-relaxed truncate">{{ item.subject || 'Strategic Inquiry' }}</div>
                             </div>

                             <div class="flex items-center justify-between border-t border-slate-50 pt-4">
                                <div class="flex flex-col gap-0.5">
                                   <span class="text-[7px] font-black text-slate-300 uppercase tracking-widest">Secure Endpoint</span>
                                   <span class="text-[10px] font-black text-slate-500 truncate max-w-[120px]">{{ item.phone || item.email }}</span>
                                </div>
                                <div class="flex gap-2">
                                  <button (click)="toggleExpand(item._id)" [class]="'w-10 h-10 rounded-xl flex items-center justify-center transition shadow-sm ' + (expandedInquiryId() === item._id ? 'bg-brand-primary text-white' : 'bg-slate-100 text-slate-400')">
                                    <i class="fas" [class.fa-eye]="expandedInquiryId() !== item._id" [class.fa-eye-slash]="expandedInquiryId() === item._id"></i>
                                  </button>
                                  <button (click)="deleteInquiry(item._id)" class="w-10 h-10 rounded-xl bg-red-50 text-red-400 flex items-center justify-center border border-red-100 active:scale-95 transition">
                                    <i class="fas fa-trash-alt text-[10px]"></i>
                                  </button>
                                </div>
                             </div>

                             @if (expandedInquiryId() === item._id) {
                                <div class="mt-8 pt-6 border-t border-slate-100 animate-reveal space-y-6">
                                   <div class="bg-brand-darkest text-white/90 p-5 rounded-2xl shadow-xl">
                                      <div class="text-[8px] font-black uppercase text-brand-primary tracking-widest mb-4 flex items-center gap-2">
                                         <i class="fas fa-quote-left opacity-30"></i> Decrypted Signal
                                      </div>
                                      <p class="text-[12px] leading-relaxed font-medium whitespace-pre-wrap">{{ item.message }}</p>
                                   </div>

                                   <div class="grid grid-cols-1 gap-3">
                                      <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                         <div>
                                            <div class="text-[8px] font-black uppercase text-slate-300 mb-0.5">Communication Line</div>
                                            <div class="text-[10px] font-black text-brand-primary break-all">{{ item.email }}</div>
                                         </div>
                                         <a [href]="'mailto:' + item.email" class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400"><i class="fas fa-envelope text-xs"></i></a>
                                      </div>
                                      @if (item.phone) {
                                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
                                           <div>
                                              <div class="text-[8px] font-black uppercase text-slate-300 mb-0.5">Secure Voice</div>
                                              <div class="text-[10px] font-black text-slate-500">{{ item.phone }}</div>
                                           </div>
                                           <a [href]="'tel:' + item.phone" class="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-slate-400"><i class="fas fa-phone text-xs"></i></a>
                                        </div>
                                      }
                                   </div>

                                   <div class="flex gap-2">
                                      <button (click)="updateInquiryStatus(item._id, 'Contacted')" class="flex-grow bg-blue-500 text-white rounded-2xl py-4 text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition">Update Status</button>
                                      <button (click)="updateInquiryStatus(item._id, 'Resolved')" class="flex-grow bg-green-500 text-white rounded-2xl py-4 text-[9px] font-black uppercase tracking-widest shadow-xl shadow-green-500/20 active:scale-95 transition">Secure Entity</button>
                                   </div>
                                </div>
                             }
                          </div>
                        }
                      </div>

                      <!-- Pagination -->
                      <div class="flex flex-col md:flex-row justify-between items-center gap-6 mt-8" *ngIf="totalPages() > 1">
                        <div class="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Summary: Page {{ inquiryPage() }} of {{ totalPages() }}
                        </div>
                        <div class="flex items-center gap-2">
                          <button (click)="inquiryPage.set(inquiryPage() - 1)" [disabled]="inquiryPage() === 1" class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary disabled:opacity-30 transition-all">
                            <i class="fas fa-chevron-left text-xs"></i>
                          </button>

                          <div class="flex items-center gap-1">
                            @for (p of [].constructor(totalPages()); track $index) {
                              <button (click)="inquiryPage.set($index + 1)" [class]="'w-10 h-10 rounded-xl text-[10px] font-black transition-all ' + (inquiryPage() === $index + 1 ? 'bg-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white border border-slate-100 text-slate-400 hover:border-brand-primary hover:text-brand-primary')">
                                {{ $index + 1 }}
                              </button>
                            }
                          </div>

                          <button (click)="inquiryPage.set(inquiryPage() + 1)" [disabled]="inquiryPage() === totalPages()" class="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-brand-primary disabled:opacity-30 transition-all">
                            <i class="fas fa-chevron-right text-xs"></i>
                          </button>
                        </div>
                      </div>
                    }
                  </div>
                } @else if (activeTab() === 'Home Page') {
                  <div class="space-y-16">
                    <div>
                      <h3 class="text-[11px] font-black text-brand-darkest uppercase tracking-[0.4em] mb-10 border-l-8 border-brand-primary pl-6">Hero Dynamic Slideshow</h3>
                      <div class="space-y-8">
                        @for (slide of appData().content.home.hero.slides; track slide.id; let idx = $index) {
                          <div class="bg-slate-50/50 p-8 md:p-10 rounded-[40px] border border-slate-100 relative group hover:bg-white hover:shadow-2xl transition-all duration-500">
                            <button (click)="removeListItem('content.home.hero.slides', idx)" class="absolute top-6 right-6 text-red-400 hover:text-red-600 w-10 h-10 rounded-xl bg-white border flex items-center justify-center transition shadow-sm"><i class="fas fa-trash-alt"></i></button>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                              <div class="space-y-2">
                                 <label class="text-[9px] font-black uppercase tracking-widest opacity-50 ml-1">Headline</label>
                                 <input class="w-full bg-white p-3 md:p-4 rounded-xl text-sm font-bold border outline-none" placeholder="Headline" [(ngModel)]="slide.title" />
                              </div>
                              <div class="space-y-2">
                                 <label class="text-[9px] font-black uppercase tracking-widest opacity-50 ml-1">Sub-headline</label>
                                 <input class="w-full bg-white p-3 md:p-4 rounded-xl text-sm border outline-none" placeholder="Sub-headline" [(ngModel)]="slide.subtitle" />
                              </div>
                              <div class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                                 <!-- Background Image -->
                                 <div class="flex gap-4 items-center">
                                    <div class="w-16 h-16 bg-white border rounded-xl flex-shrink-0 overflow-hidden">
                                      @if (slide.image) { <img [src]="slide.image" class="w-full h-full object-cover" /> }
                                    </div>
                                     <div class="flex-grow space-y-2">
                                       <label class="text-[9px] font-black uppercase tracking-widest mb-1 block opacity-50">Background Image</label>
                                       <input
                                         type="file"
                                         [id]="'home-slide-' + idx"
                                         class="hidden"
                                         (change)="onFileSelected($event, 'slide', idx)"
                                       />
                                       <label [for]="'home-slide-' + idx" class="w-full block bg-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-300 text-center cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2"><i class="fas fa-mountain text-xs"></i>Upload Background</label>
                                       <div class="flex items-center gap-2">
                                         <i class="fas fa-link text-gray-300 text-[8px]"></i>
                                         <input class="flex-grow bg-gray-50 p-2 rounded-xl text-[10px] border border-gray-100 outline-none" placeholder="Or paste background URL..." (change)="onUrlInput($any($event.target).value, 'slide', idx)" />
                                       </div>
                                     </div>
                                 </div>


                              </div>
                            </div>
                          </div>
                        }
                        <button (click)="addSlide()" class="w-full py-8 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-[0.2em] text-[10px] hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2"><i class="fas fa-plus-circle"></i> New Hero Frame</button>
                      </div>
                    </div>

                    <!-- Intro Section Configuration -->
                    <div>
                      <h3 class="text-[11px] font-black text-brand-darkest uppercase tracking-[0.4em] mb-10 border-l-8 border-brand-primary pl-6">Company Intro Section</h3>
                      <div class="bg-white p-8 md:p-10 rounded-[40px] border border-slate-100 space-y-8 shadow-sm">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div class="space-y-2">
                            <label class="text-[9px] font-black uppercase tracking-widest opacity-50 ml-1">Tagline</label>
                            <input class="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold border outline-none" placeholder="e.g. Precision Engineering" [(ngModel)]="appData().content.home.intro.tagline" />
                          </div>
                          <div class="space-y-2">
                            <label class="text-[9px] font-black uppercase tracking-widest opacity-50 ml-1">Title</label>
                            <input class="w-full bg-slate-50 p-4 rounded-xl text-sm font-bold border outline-none" placeholder="Intro Title" [(ngModel)]="appData().content.home.intro.title" />
                          </div>
                        </div>

                        <div class="space-y-2">
                          <label class="text-[9px] font-black uppercase tracking-widest opacity-50 ml-1">Description</label>
                          <textarea class="w-full bg-slate-50 p-4 rounded-xl text-sm border outline-none min-h-[120px]" placeholder="Company Introduction Description" [(ngModel)]="appData().content.home.intro.description"></textarea>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                          <!-- Video URL -->
                          <div class="space-y-2">
                            <label class="text-[9px] font-black uppercase tracking-widest opacity-50 ml-1">Demo Video URL (Direct MP4)</label>
                            <div class="flex items-center gap-2">
                              <i class="fas fa-video text-slate-300"></i>
                              <input class="flex-grow bg-slate-50 p-4 rounded-xl text-xs border outline-none font-mono" placeholder="https://example.com/video.mp4" [(ngModel)]="appData().content.home.intro.videoUrl" />
                            </div>
                            <p class="text-[8px] text-slate-400 italic">Provide a direct link to an MP4 video file.</p>
                          </div>

                          <!-- Poster Image -->
                          <div class="flex gap-4 items-center">
                            <div class="w-20 h-20 bg-slate-50 border rounded-2xl flex-shrink-0 overflow-hidden shadow-inner">
                              @if (appData().content.home.intro.image) { <img [src]="appData().content.home.intro.image" class="w-full h-full object-cover" /> }
                              @else { <div class="w-full h-full flex items-center justify-center text-slate-200"><i class="fas fa-image text-2xl"></i></div> }
                            </div>
                            <div class="flex-grow space-y-2">
                              <label class="text-[9px] font-black uppercase tracking-widest mb-1 block opacity-50">Video Poster Image</label>
                              <input type="file" id="intro-poster" class="hidden" (change)="onFileSelected($event, 'intro-image')" />
                              <label for="intro-poster" class="w-full block bg-white p-3 rounded-xl text-[10px] font-black uppercase tracking-widest border border-dashed border-gray-300 text-center cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2"><i class="fas fa-upload text-xs"></i>Upload Poster</label>
                              <div class="flex items-center gap-2">
                                <i class="fas fa-link text-gray-300 text-[8px]"></i>
                                <input class="flex-grow bg-gray-50 p-2 rounded-xl text-[10px] border border-gray-100 outline-none" placeholder="Or paste image URL..." (change)="onUrlInput($any($event.target).value, 'intro-image')" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                } @else if (activeTab() === 'About Us') {
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
                } @else if (activeTab() === 'Contact Info') {
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
                          <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] mb-4 border-l-4 border-brand-primary pl-4">Geography & Intelligence</h3>
                          <textarea class="w-full bg-gray-50 p-4 rounded-xl text-sm border outline-none min-h-[100px]" placeholder="HQ Map Address" [(ngModel)]="appData().content.contact.address"></textarea>
                          <div class="space-y-2">
                            <label class="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">Google Maps Embed URL</label>
                            <input class="w-full bg-gray-50 p-4 rounded-xl text-[10px] border outline-none font-mono" placeholder="https://www.google.com/maps/embed?..." [(ngModel)]="appData().content.contact.mapEmbed" />
                            <p class="text-[8px] text-slate-400 italic">Paste the 'src' value from the Google Maps iframe embed code.</p>
                          </div>
                        </div>
                    </div>
                  </div>
                } @else if (activeTab() === 'Categories') {
                  <div class="space-y-8">
                    <div class="flex items-center justify-between">
                      <h3 class="text-xs font-black text-brand-darkest uppercase tracking-[0.4em] border-l-4 border-brand-primary pl-4">Taxonomy Management</h3>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      @for (cat of appData().categories; track cat.id; let idx = $index) {
                        <div class="p-6 bg-gray-50 rounded-3xl border border-gray-100 flex flex-col gap-4 group hover:bg-white hover:shadow-xl transition-all">
                          <div class="flex items-center gap-4">
                            <div class="w-12 h-12 bg-white rounded-xl border flex items-center justify-center text-brand-primary shadow-sm hover:scale-110 transition-transform">
                              <i [class]="'fas fa-' + cat.icon"></i>
                            </div>
                            <input class="flex-grow bg-transparent font-black text-brand-darkest uppercase italic tracking-tighter text-sm outline-none border-b border-transparent focus:border-brand-primary transition-colors" [(ngModel)]="cat.name" placeholder="Category Name" />
                            <button (click)="removeListItem('categories', idx)" class="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all w-8 h-8 rounded-lg hover:bg-red-50 flex items-center justify-center"><i class="fas fa-trash-alt text-xs"></i></button>
                          </div>

                          <!-- Image Block -->
                          <div class="flex gap-4 items-center pl-16">
                            <div class="w-20 h-20 bg-white border border-gray-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner p-2 flex items-center justify-center">
                              @if (cat.image) {
                                <img [src]="cat.image" class="max-w-full max-h-full object-contain filter grayscale group-hover:grayscale-0 transition-all duration-500" />
                              } @else {
                                <i class="fas fa-image text-gray-200 text-2xl"></i>
                              }
                            </div>
                            <div class="flex-grow space-y-2">
                              <input type="file" [id]="'cat-img-' + idx" class="hidden" (change)="onFileSelected($event, 'category', idx)" />
                              <label [for]="'cat-img-' + idx" class="w-full block bg-white p-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-dashed border-gray-300 text-center cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-all text-gray-500 flex items-center justify-center gap-2">
                                <i class="fas fa-folder-open text-xs"></i> Upload File
                              </label>
                              <div class="flex items-center gap-2">
                                <i class="fas fa-link text-gray-300 text-xs"></i>
                                <input class="flex-grow bg-gray-50 p-2 rounded-xl text-[11px] border border-gray-100 outline-none" placeholder="Or paste URL..." (change)="onUrlInput($any($event.target).value, 'category', idx)" />
                              </div>
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                    <button (click)="addCategory()" class="w-full py-6 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:border-brand-primary hover:text-brand-primary transition-all">Append Classification</button>
                  </div>
                } @else if (activeTab() === 'Blog Posts') {
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
                          <div class="flex gap-3">
                             <button (click)="editingBlog.set(post)" class="w-10 h-10 rounded-xl bg-white border border-gray-100 text-brand-primary hover:bg-brand-primary hover:text-white transition-all shadow-sm flex items-center justify-center">
                               <i class="fas fa-pen-nib text-xs"></i>
                             </button>
                             <button (click)="removeListItem('blogs', idx)" class="w-10 h-10 rounded-xl hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex items-center justify-center"><i class="fas fa-trash-alt text-xs"></i></button>
                          </div>
                        </div>
                      }
                      <button (click)="addBlogPost()" class="w-full py-8 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-black uppercase tracking-widest text-[10px] hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-3"><i class="fas fa-plus-circle"></i> New Intelligence Brief</button>
                    </div>
                  </div>
                } @else if (activeTab() === 'Products') {
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
              </div> <!-- Close glass container -->
            } <!-- Close @else -->
          </div> <!-- Close max-w-5xl -->
        </main>

      <!-- Edit Modal - Unified approach for brevity -->
      @if (editingProduct()) {
        <div class="fixed inset-0 bg-brand-darkest/60 backdrop-blur-xl flex items-center justify-center z-[200] p-2 md:p-4 animate-fade-in">
            <div class="bg-white w-full max-w-3xl rounded-t-[32px] md:rounded-[48px] lg:rounded-[48px] shadow-3xl overflow-hidden animate-reveal border border-white/20 flex flex-col h-full md:h-auto max-h-screen md:max-h-[98vh]">
              <div class="bg-gray-50 px-6 md:px-10 py-5 md:py-7 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 class="font-black text-brand-darkest uppercase tracking-widest text-[10px] mb-1">Entity Modification</h3>
                  <p class="text-[9px] text-brand-primary font-black uppercase tracking-widest">Secure Product Interface</p>
                </div>
                <button (click)="editingProduct.set(null)" class="w-10 h-10 rounded-xl hover:bg-white transition-all text-gray-400 flex items-center justify-center border border-transparent hover:border-gray-100">
                  <i class="fas fa-times text-xs"></i>
                </button>
              </div>

              <div class="p-6 md:p-10 space-y-6 md:space-y-8 overflow-y-auto">

                <!-- Product Image Upload (FIXED) -->
                <div class="space-y-3">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Product Image</label>
                  <div class="flex gap-5 items-center">
                    <div class="w-28 h-28 bg-gray-50 border border-gray-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner flex items-center justify-center p-2">
                      @if (editingProduct()!.image) {
                        <img [src]="editingProduct()!.image" class="max-w-full max-h-full object-contain" />
                      } @else {
                        <i class="fas fa-image text-gray-200 text-3xl"></i>
                      }
                    </div>
                    <div class="flex-grow space-y-2">
                      <input #productImgInput type="file" class="hidden" accept="image/*" (change)="onFileSelected($event, 'product')" />
                      <button (click)="productImgInput.click()" class="w-full bg-gray-50 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-dashed border-gray-300 text-center hover:border-brand-primary hover:text-brand-primary transition-all text-gray-500 flex items-center justify-center gap-2">
                        <i class="fas fa-folder-open"></i> Upload Local File
                      </button>
                      <div class="flex items-center gap-2">
                        <i class="fas fa-link text-gray-300 text-xs"></i>
                        <input class="flex-grow bg-gray-50 p-3 rounded-xl text-[11px] border border-gray-100 outline-none focus:ring-1 focus:ring-brand-primary" placeholder="Or paste image URL..." (change)="onUrlInput($any($event.target).value, 'product')" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Name + Category + Weight + Price -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                  <div class="col-span-2 space-y-2">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Product Name</label>
                    <input class="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingProduct()!.name" placeholder="Full Product Name" />
                  </div>
                  <div class="space-y-2">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Category</label>
                    <select class="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingProduct()!.category">
                      @for (cat of appData().categories; track cat.id) {
                        <option [value]="cat.name">{{ cat.name }}</option>
                      }
                    </select>
                  </div>
                  <div class="space-y-2">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Weight</label>
                    <input class="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingProduct()!.weight" placeholder="e.g. 150 kg" />
                  </div>
                  <div class="col-span-2 space-y-2">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Price</label>
                    <input class="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingProduct()!.price" placeholder="e.g. Contact for Quote or ₹25,000" />
                  </div>
                </div>

                <!-- Description -->
                <div class="space-y-2">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Short Description</label>
                  <textarea class="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all shadow-inner min-h-[90px]" [(ngModel)]="editingProduct()!.description" placeholder="Short product summary..."></textarea>
                </div>
                <div class="space-y-2">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Long Description</label>
                  <textarea class="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all shadow-inner min-h-[130px]" [(ngModel)]="editingProduct()!.longDescription" placeholder="Detailed product description..."></textarea>
                </div>

                <!-- Features -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400">Key Features</label>
                    <button (click)="addFeature('features')" class="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:underline flex items-center gap-1"><i class="fas fa-plus-circle text-xs"></i> Add</button>
                  </div>
                  @for (feat of editingProduct()!.features; track $index; let fi = $index) {
                    <div class="flex items-center gap-3">
                      <input class="flex-grow bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold text-sm outline-none focus:ring-1 focus:ring-brand-primary" [(ngModel)]="editingProduct()!.features[fi]" placeholder="Feature line..." />
                      <button (click)="removeFeature('features', fi)" class="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-times text-xs"></i></button>
                    </div>
                  }
                </div>

                <!-- Technical Features -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400">Technical Features</label>
                    <button (click)="addFeature('technicalFeatures')" class="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:underline flex items-center gap-1"><i class="fas fa-plus-circle text-xs"></i> Add</button>
                  </div>
                  @for (feat of (editingProduct()!.technicalFeatures || []); track $index; let ti = $index) {
                    <div class="flex items-center gap-3">
                      <input class="flex-grow bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold text-sm outline-none focus:ring-1 focus:ring-brand-primary" [(ngModel)]="editingProduct()!.technicalFeatures![ti]" placeholder="Technical feature..." />
                      <button (click)="removeFeature('technicalFeatures', ti)" class="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-times text-xs"></i></button>
                    </div>
                  }
                </div>

                <!-- Salient Specs -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400">Salient Specs (Badges)</label>
                    <button (click)="addFeature('salientSpecs')" class="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:underline flex items-center gap-1"><i class="fas fa-plus-circle text-xs"></i> Add</button>
                  </div>
                  @for (spec of (editingProduct()!.salientSpecs || []); track $index; let si = $index) {
                    <div class="flex items-center gap-3">
                      <input class="flex-grow bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold text-sm outline-none focus:ring-1 focus:ring-brand-primary" [(ngModel)]="editingProduct()!.salientSpecs![si]" placeholder="e.g. Fire Rating: 120 mins" />
                      <button (click)="removeFeature('salientSpecs', si)" class="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-times text-xs"></i></button>
                    </div>
                  }
                </div>

                <!-- Specifications (Key-Value) -->
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400">Specifications Table</label>
                    <button (click)="addSpec()" class="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:underline flex items-center gap-1"><i class="fas fa-plus-circle text-xs"></i> Add Row</button>
                  </div>
                  @for (spec of editingProduct()!.specifications; track $index; let spi = $index) {
                    <div class="flex items-center gap-3">
                      <input class="w-2/5 bg-gray-50 p-3 rounded-xl border border-gray-100 font-black text-[11px] uppercase outline-none focus:ring-1 focus:ring-brand-primary" [(ngModel)]="editingProduct()!.specifications[spi].label" placeholder="Label (e.g. Capacity)" />
                      <span class="text-gray-300">:</span>
                      <input class="flex-grow bg-gray-50 p-3 rounded-xl border border-gray-100 font-bold text-sm outline-none focus:ring-1 focus:ring-brand-primary" [(ngModel)]="editingProduct()!.specifications[spi].value" placeholder="Value (e.g. 50L)" />
                      <button (click)="removeSpec(spi)" class="w-9 h-9 rounded-xl bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center flex-shrink-0"><i class="fas fa-times text-xs"></i></button>
                    </div>
                  }
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

      <!-- Blog Edit Modal -->
      @if (editingBlog()) {
        <div class="fixed inset-0 bg-brand-darkest/60 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-fade-in">
           <div class="bg-white w-full max-w-3xl rounded-t-[32px] md:rounded-[48px] shadow-3xl overflow-hidden animate-reveal border border-white/20 flex flex-col h-full md:h-auto max-h-screen md:max-h-[90vh]">
              <div class="bg-gray-50 px-6 md:px-12 py-6 md:py-8 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 class="font-black text-brand-darkest uppercase tracking-widest text-[10px] mb-1">Intelligence Brief Editor</h3>
                  <p class="text-[9px] text-brand-primary font-black uppercase tracking-widest">Secure Article Management</p>
                </div>
                <button (click)="editingBlog.set(null)" class="w-10 h-10 rounded-xl hover:bg-white transition-all text-gray-400 flex items-center justify-center border border-transparent hover:border-gray-100">
                  <i class="fas fa-times text-xs"></i>
                </button>
              </div>

              <div class="p-6 md:p-12 space-y-6 md:space-y-8 overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div class="space-y-4">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Headline</label>
                    <input class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all shadow-inner" [(ngModel)]="editingBlog()!.title" placeholder="Article Title" />
                  </div>
                  <div class="space-y-4">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">URL Slug</label>
                    <input class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingBlog()!.slug" placeholder="e.g. security-update-2025" />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div class="space-y-4">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Author</label>
                    <input class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingBlog()!.author" placeholder="Author Name" />
                  </div>
                  <div class="space-y-4">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Publish Date</label>
                    <input class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingBlog()!.date" placeholder="DD/MM/YYYY" />
                  </div>
                </div>

                <div class="space-y-4">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Brief Excerpt</label>
                  <textarea class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all shadow-inner min-h-[100px]" [(ngModel)]="editingBlog()!.excerpt" placeholder="Short description..."></textarea>
                </div>

                <div class="space-y-4">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Article Content</label>
                  <textarea class="w-full bg-gray-50 p-5 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all shadow-inner min-h-[250px]" [(ngModel)]="editingBlog()!.content" placeholder="Full HTML or text content..."></textarea>
                </div>

                <div class="space-y-4 flex-shrink-0">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Cover Image</label>
                  <div class="flex gap-4 items-center">
                    <div class="w-32 h-20 bg-gray-50 border rounded-2xl overflow-hidden flex-shrink-0">
                      @if (editingBlog()!.image) { <img [src]="editingBlog()!.image" class="w-full h-full object-cover" /> }
                    </div>
                    <div class="flex-grow space-y-2">
                      <input type="file" id="blog-img-upload" class="hidden" (change)="onFileSelected($event, 'blog-edit')" />
                      <label for="blog-img-upload" class="w-full block bg-gray-50 p-3 rounded-xl text-[9px] font-black uppercase tracking-widest border border-dashed border-gray-300 text-center cursor-pointer hover:border-brand-primary hover:text-brand-primary transition-all flex items-center justify-center gap-2">
                        <i class="fas fa-folder-open text-xs"></i> Upload File
                      </label>
                      <div class="flex items-center gap-2">
                        <i class="fas fa-link text-gray-300 text-xs"></i>
                        <input class="flex-grow bg-gray-50 p-2 rounded-xl text-[11px] border border-gray-100 outline-none" placeholder="Or paste cover URL..." (change)="onUrlInput($any($event.target).value, 'blog-edit')" />
                      </div>
                    </div>
                  </div>
                </div>

                <div class="flex gap-4 pt-4 pb-4">
                  <button (click)="saveBlog()" class="flex-grow bg-brand-darkest text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all active:scale-95 shadow-xl">
                    Publish Article
                  </button>
                  <button (click)="editingBlog.set(null)" class="px-8 bg-gray-50 text-gray-400 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:text-gray-600 transition-all border border-gray-100">
                    Cancel
                  </button>
                </div>
              </div>
           </div>
        </div>
      }
      @if (editingAdminModal()) {
        <div class="fixed inset-0 bg-brand-darkest/60 backdrop-blur-xl flex items-center justify-center z-[200] p-4 animate-fade-in">
           <div class="bg-white w-full max-w-2xl rounded-t-[32px] md:rounded-[48px] shadow-3xl overflow-hidden animate-reveal border border-white/20 flex flex-col max-h-[90vh]">
              <div class="bg-gray-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                <div>
                  <h3 class="font-black text-brand-darkest uppercase tracking-widest text-[10px] mb-1">Strategic Asset Enrollment</h3>
                  <p class="text-[9px] text-brand-primary font-black uppercase tracking-widest">{{ editingAdminModal()._id ? 'Modify Existing Unit' : 'New Personnel Authorization' }}</p>
                </div>
                <button (click)="editingAdminModal.set(null)" class="w-10 h-10 rounded-xl hover:bg-white transition-all text-gray-400 flex items-center justify-center border border-transparent hover:border-gray-100">
                  <i class="fas fa-times text-xs"></i>
                </button>
              </div>

              <div class="p-8 space-y-6 overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Identity Username</label>
                    <input class="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingAdminModal().username" [disabled]="editingAdminModal()._id" placeholder="e.g. j_smith" />
                  </div>
                  <div class="space-y-2">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Access PIN / Password</label>
                    <input type="password" class="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingAdminModal().password" [placeholder]="editingAdminModal()._id ? '•••••••• (Leave blank to keep)' : 'Temporary password'" />
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Full Personnel Name</label>
                    <input class="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingAdminModal().fullName" placeholder="e.g. John Smith" />
                  </div>
                  <div class="space-y-2">
                    <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Secure Email Channel</label>
                    <input type="email" class="w-full bg-gray-50 p-4 rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-brand-primary font-bold text-sm transition-all" [(ngModel)]="editingAdminModal().email" placeholder="admin@yogisafe.com" />
                  </div>
                </div>

                <div class="space-y-4">
                  <label class="block text-[9px] font-black uppercase tracking-widest text-gray-400 ml-1">Strategic Privileges</label>
                  <div class="grid grid-cols-2 gap-3">
                    @for (perm of availablePermissions; track perm) {
                      <div (click)="togglePermission(perm)" class="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-all" [class]="editingAdminModal().permissions.includes(perm) ? 'bg-brand-primary/5 border-brand-primary/20' : ''">
                        <div class="w-5 h-5 rounded-md border flex items-center justify-center transition-all" [class.bg-brand-primary]="editingAdminModal().permissions.includes(perm)" [class.border-brand-primary]="editingAdminModal().permissions.includes(perm)">
                          @if (editingAdminModal().permissions.includes(perm)) {
                            <i class="fas fa-check text-[10px] text-white"></i>
                          }
                        </div>
                        <span [class]="'text-[10px] font-black uppercase tracking-tighter ' + (editingAdminModal().permissions.includes(perm) ? 'text-brand-primary' : 'text-slate-500')">{{ perm }}</span>
                      </div>
                    }
                  </div>
                </div>

                <div class="flex gap-4 pt-4">
                  <button (click)="saveAdmin()" class="flex-grow bg-brand-darkest text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-black transition-all active:scale-95 shadow-xl flex items-center justify-center gap-2">
                    {{ editingAdminModal()._id ? 'Authorize Updates' : 'Commit Enrollment' }}
                  </button>
                  <button (click)="editingAdminModal.set(null)" class="px-8 bg-gray-50 text-gray-400 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white hover:text-gray-600 transition-all border border-gray-100">
                    Abort
                  </button>
                </div>
              </div>
           </div>
        </div>
      }

    </div>
  </div>
  `,
  styles: []
})
export class AdminPanelComponent implements OnInit {
  tabs: AdminPage[] = ['Home Page', 'About Us', 'Contact Info', 'Products', 'Categories', 'Blog Posts', 'Inquiries'];
  activeTab = signal<AdminPage>('Home Page');

  visibleTabs = computed(() => {
    if (this.userRole() === 'super_admin') return [...this.tabs, 'Admin Management', 'Profile'] as AdminPage[];
    // Profile is always visible to everyone
    return [...this.tabs.filter(t => this.userPermissions().includes(t)), 'Profile'] as AdminPage[];
  });

  // Security & Authentication
  isAuthenticated = signal(false);
  userRole = signal<string>('sub_admin');
  userPermissions = signal<string[]>([]);
  userFullName = signal<string>('SafeSmart Admin');

  username = '';
  loginKey = ''; // Used as password
  loginError = signal('');

  private idleTimer: any;

  @HostListener('document:mousemove')
  @HostListener('document:keypress')
  @HostListener('document:click')
  @HostListener('document:scroll')
  resetIdleTimer() {
    if (this.isAuthenticated()) {
      clearTimeout(this.idleTimer);
      this.idleTimer = setTimeout(() => {
        this.handleLogout();
        this.showFeedback('Session expired due to inactivity', 'error');
      }, 30 * 60 * 1000); // 30 minutes
    }
  }

  // Reactive local state for editing
  appData = signal<AppData>(null as any);
  products = computed(() => this.appData()?.products || []);

  feedback = signal<{ msg: string; type: 'success' | 'error' } | null>(null);
  isProcessingImage = signal(false);
  isSaving = signal(false);
  isDeploying = signal(false);

  editingProduct = signal<Product | null>(null);
  editingBlog = signal<BlogPost | null>(null);

  isSidebarOpen = signal(false); // Mobile sidebar state

  // Inquiries State
  inquiries = signal<any[]>([]);
  inquiryFilter = signal<'All' | 'New' | 'Contacted' | 'Resolved'>('All');
  inquiryPage = signal(1);
  pageSize = 10;
  selectedInquiryIds = signal<string[]>([]);
  expandedInquiryId = signal<string | null>(null);
  isLoadingInquiries = signal(false);

  filteredInquiries = computed(() => {
    let list = this.inquiries();
    const filter = this.inquiryFilter();
    if (filter !== 'All') {
      list = list.filter(i => (i.status || 'New') === filter);
    }
    return list;
  });

  paginatedInquiries = computed(() => {
    const list = this.filteredInquiries();
    const start = (this.inquiryPage() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  totalPages = computed(() => Math.ceil(this.filteredInquiries().length / this.pageSize));

  adminList = signal<any[]>([]);
  editingAdminModal = signal<any>(null); // For Add/Edit Modal
  availablePermissions: string[] = ['Home Page', 'About Us', 'Contact Info', 'Products', 'Categories', 'Blog Posts', 'Inquiries', 'Admin Management'];

  @HostListener('window:keydown.escape', ['$event'])
  handleEscape(event: any) {
    this.editingProduct.set(null);
    this.editingBlog.set(null);
    this.isSidebarOpen.set(false);
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  constructor(
    private dataService: DataService,
    public apiService: ApiService
  ) {
    this.isAuthenticated.set(this.apiService.token() !== null);
  }

  ngOnInit() {
    if (this.apiService.token()) {
      // Re-fetch profile to sync role/name
      this.apiService.getAdminProfile().subscribe({
        next: (profile) => {
          this.userRole.set(profile.role);
          this.userFullName.set(profile.fullName);
          this.userPermissions.set(profile.permissions);
          this.isAuthenticated.set(true);
          this.resetIdleTimer();
          this.fetchInquiries();
          if (profile.role === 'super_admin') {
            this.fetchAdminList();
          }
        },
        error: () => this.handleLogout()
      });
    }

    const currentData = this.dataService.getAppData();
    if (currentData) {
      this.appData.set(JSON.parse(JSON.stringify(currentData)));
    }
  }

  fetchInquiries() {
    this.isLoadingInquiries.set(true);
    this.apiService.getInquiries().subscribe({
      next: (data) => {
        this.inquiries.set(data);
        this.isLoadingInquiries.set(false);
      },
      error: (err) => {
        console.error('Error fetching inquiries', err);
        this.isLoadingInquiries.set(false);
      }
    });
  }

  exportInquiriesToExcel() {
    const data = this.inquiries();
    if (data.length === 0) return;

    // Create CSV content
    const headers = ['Name', 'Email', 'Phone', 'Subject', 'Message', 'Date'];
    const rows = data.map(i => [
      `"${i.name}"`,
      `"${i.email}"`,
      `"${i.phone || ''}"`,
      `"${i.subject || ''}"`,
      `"${i.message.replace(/"/g, '""')}"`,
      new Date(i.createdAt).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Inquiries_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  alert(msg: string) {
    window.alert(msg);
  }

  getTimeAgo(date: any): string {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  updateInquiryStatus(id: string, status: string) {
    this.apiService.updateInquiryStatus(id, status).subscribe({
      next: () => {
        this.showFeedback('Status Updated');
        this.fetchInquiries();
      },
      error: (err) => {
        console.error('Error updating status', err);
        this.showFeedback('Failed to update status', 'error');
      }
    });
  }

  deleteInquiry(id: string) {
    if (!confirm('Are you sure you want to delete this inquiry? This action cannot be undone.')) return;
    this.apiService.deleteInquiry(id).subscribe({
      next: () => {
        this.showFeedback('Inquiry Deleted');
        this.fetchInquiries();
      },
      error: () => this.showFeedback('Failed to delete inquiry', 'error')
    });
  }

  toggleSelection(id: string) {
    const selected = this.selectedInquiryIds();
    if (selected.includes(id)) {
      this.selectedInquiryIds.set(selected.filter(i => i !== id));
    } else {
      this.selectedInquiryIds.set([...selected, id]);
    }
  }

  toggleAllSelection() {
    if (this.selectedInquiryIds().length === this.paginatedInquiries().length) {
      this.selectedInquiryIds.set([]);
    } else {
      this.selectedInquiryIds.set(this.paginatedInquiries().map(i => i._id));
    }
  }

  handleBulkAction(action: string) {
    const ids = this.selectedInquiryIds();
    if (ids.length === 0) return;

    if (action === 'delete') {
      if (!confirm(`Delete ${ids.length} inquiries?`)) return;
      this.apiService.batchInquiryOperation(ids, 'delete').subscribe({
        next: () => {
          this.showFeedback(`${ids.length} Inquiries Deleted`);
          this.selectedInquiryIds.set([]);
          this.fetchInquiries();
        },
        error: () => this.showFeedback('Bulk delete failed', 'error')
      });
    } else if (action === 'markContacted' || action === 'markResolved' || action === 'markNew') {
      const status = action === 'markContacted' ? 'Contacted' : (action === 'markResolved' ? 'Resolved' : 'New');
      this.apiService.batchInquiryOperation(ids, 'updateStatus', status).subscribe({
        next: () => {
          this.showFeedback('Batch Status Updated');
          this.selectedInquiryIds.set([]);
          this.fetchInquiries();
        },
        error: () => this.showFeedback('Batch update failed', 'error')
      });
    }
  }

  toggleExpand(id: string) {
    this.expandedInquiryId.update(currentId => currentId === id ? null : id);
  }

  async handleLogin() {
    if (!this.username || !this.loginKey) {
      this.loginError.set('Username and Access Pin required.');
      return;
    }

    try {
      const res = await this.apiService.login(this.username, this.loginKey);
      this.userRole.set(res.user.role);
      this.userPermissions.set(res.user.permissions);
      this.userFullName.set(res.user.fullName);
      this.isAuthenticated.set(true);

      this.showFeedback('Command Authorization Successful', 'success');
      this.resetIdleTimer();
      this.fetchInquiries();
      if (res.user.role === 'super_admin') {
        this.fetchAdminList();
      }

      const currentData = this.dataService.getAppData();
      if (currentData) {
        this.appData.set(JSON.parse(JSON.stringify(currentData)));
      }
    } catch (err: any) {
      this.loginError.set(err.error?.message || 'Invalid Credentials. Access Restricted.');
      setTimeout(() => this.loginError.set(''), 3000);
    }
  }

  handleLogout() {
    this.apiService.logout();
    this.isAuthenticated.set(false);
    this.activeTab.set('Home Page');
    clearTimeout(this.idleTimer);
  }

  updateProfile() {
    const data = {
      fullName: this.userFullName(),
      // Add other fields if needed
    };
    this.apiService.updateAdminProfile(data).subscribe({
      next: () => this.showFeedback('Profile Updated Successfully', 'success'),
      error: () => this.showFeedback('Failed to update profile', 'error')
    });
  }

  fetchAdminList() {
    this.apiService.getAllAdmins().subscribe({
      next: (list) => this.adminList.set(list),
      error: () => this.showFeedback('Failed to fetch admin list', 'error')
    });
  }

  openAddAdminModal() {
    this.editingAdminModal.set({
      username: '',
      password: '',
      fullName: '',
      email: '',
      phone: '',
      role: 'sub_admin',
      permissions: ['Inquiries']
    });
  }

  editAdmin(admin: any) {
    this.editingAdminModal.set({ ...admin, password: '' }); // Don't show hashed password
  }

  togglePermission(perm: string) {
    const current = this.editingAdminModal();
    if (!current) return;

    const permissions = [...current.permissions];
    const idx = permissions.indexOf(perm);
    if (idx > -1) permissions.splice(idx, 1);
    else permissions.push(perm);

    this.editingAdminModal.set({ ...current, permissions });
  }

  saveAdmin() {
    const data = this.editingAdminModal();
    if (!data) return;

    if (!data.username || !data.fullName || (!data._id && !data.password)) {
      this.showFeedback('All vital fields required', 'error');
      return;
    }

    if (data._id) {
      // Update
      const updatePayload = { ...data };
      if (!updatePayload.password) delete updatePayload.password;

      this.apiService.updateAdmin(data._id, updatePayload).subscribe({
        next: () => {
          this.showFeedback('Admin Strategic Assets Updated', 'success');
          this.fetchAdminList();
          this.editingAdminModal.set(null);
        },
        error: (err) => this.showFeedback(err.error?.message || 'Update failed', 'error')
      });
    } else {
      // Create
      this.apiService.createAdmin(data).subscribe({
        next: () => {
          this.showFeedback('New Admin Enrolled Successfully', 'success');
          this.fetchAdminList();
          this.editingAdminModal.set(null);
        },
        error: (err) => this.showFeedback(err.error?.message || 'Enrollment failed', 'error')
      });
    }
  }

  deleteAdmin(id: string) {
    if (confirm('Are you sure you want to revoke this admin access? This action is irreversible.')) {
      this.apiService.deleteAdmin(id).subscribe({
        next: () => {
          this.showFeedback('Admin access revoked', 'success');
          this.fetchAdminList();
        },
        error: (err) => this.showFeedback(err.error?.message || 'Revocation failed', 'error')
      });
    }
  }
  syncToPreview() {
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
      case 'Inquiries': return 'inbox';
      case 'Admin Management': return 'users-cog';
      case 'Profile': return 'user-shield';
      default: return 'circle';
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

  addFeature(field: 'features' | 'technicalFeatures' | 'salientSpecs') {
    const p = this.editingProduct();
    if (!p) return;
    if (field === 'features') p.features = [...(p.features || []), ''];
    else if (field === 'technicalFeatures') p.technicalFeatures = [...(p.technicalFeatures || []), ''];
    else if (field === 'salientSpecs') p.salientSpecs = [...(p.salientSpecs || []), ''];
    this.editingProduct.set({ ...p });
  }

  removeFeature(field: 'features' | 'technicalFeatures' | 'salientSpecs', idx: number) {
    const p = this.editingProduct();
    if (!p) return;
    if (field === 'features') p.features = p.features.filter((_, i) => i !== idx);
    else if (field === 'technicalFeatures') p.technicalFeatures = (p.technicalFeatures || []).filter((_, i) => i !== idx);
    else if (field === 'salientSpecs') p.salientSpecs = (p.salientSpecs || []).filter((_, i) => i !== idx);
    this.editingProduct.set({ ...p });
  }

  addSpec() {
    const p = this.editingProduct();
    if (!p) return;
    p.specifications = [...(p.specifications || []), { label: '', value: '' }];
    this.editingProduct.set({ ...p });
  }

  removeSpec(idx: number) {
    const p = this.editingProduct();
    if (!p) return;
    p.specifications = p.specifications.filter((_, i) => i !== idx);
    this.editingProduct.set({ ...p });
  }

  saveBlog() {
    const b = this.editingBlog();
    if (b) {
      const data = this.appData();
      const idx = data.blogs.findIndex(it => it.id === b.id);
      if (idx > -1) data.blogs[idx] = b;
      else data.blogs.push(b);
      this.appData.set({ ...data });
      this.editingBlog.set(null);
    }
  }

  async onFileSelected(event: any, type: string, idx?: number) {
    let file = event.target.files[0] as File;
    if (!file) return;
    this.isProcessingImage.set(true);

    try {
      // Determine target dimensions based on type
      let targetWidth = 800;
      let targetHeight = 800;

      if (type === 'slide') {
        targetWidth = 2560;
        targetHeight = 1440;
      } else if (type === 'blog-edit' || type === 'blog') {
        targetWidth = 1600;
        targetHeight = 900;
      } else if (type === 'intro-image') {
        targetWidth = 1600;
        targetHeight = 1600;
      } else if (type === 'product' || type === 'category') {
        targetWidth = 1200;
        targetHeight = 1200;
      }

      file = await processImageForUpload(file, targetWidth, targetHeight, '#ffffff');
    } catch (err) {
      console.error('Image processing failed:', err);
      // Fallback to original file if processing fails
    }

    // Upload to server — images will be stored in dist/assets/uploads/
    const url = await this.apiService.uploadImage(file);
    if (url) {
      this.applyImageUrl(url, type, idx);
    } else {
    // Fallback to base64 for local dev if server not reachable
      const reader = new FileReader();
      reader.onload = (e) => {
        this.applyImageUrl(e.target?.result as string, type, idx);
      };
      reader.readAsDataURL(file);
    }
    this.isProcessingImage.set(false);
  }

  applyImageUrl(url: string, type: string, idx?: number) {
    const data = this.appData();
    if (type === 'slide' && idx !== undefined) {
      data.content.home.hero.slides[idx].image = url;
      this.appData.set({ ...data });
    } else if (type === 'product') {
      this.editingProduct.set({ ...this.editingProduct()!, image: url });
    } else if (type === 'blog-edit') {
      this.editingBlog.set({ ...this.editingBlog()!, image: url });
    } else if (type === 'blog' && idx !== undefined) {
      data.blogs[idx].image = url;
      this.appData.set({ ...data });
    } else if (type === 'category' && idx !== undefined) {
      data.categories[idx].image = url;
      this.appData.set({ ...data });
    } else if (type === 'intro-image') {
      data.content.home.intro.image = url;
      this.appData.set({ ...data });
    }
  }

  onUrlInput(url: string, type: string, idx?: number) {
    if (url.trim()) this.applyImageUrl(url.trim(), type, idx);
  }
}
