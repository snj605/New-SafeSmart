import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

interface Country {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

@Component({
  selector: 'app-common-contact-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    @if (status() === 'success') {
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl p-16 text-center border border-green-100">
          <div class="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">
            <i class="fas fa-check"></i>
          </div>
          <h2 class="text-3xl font-black text-brand-darkest uppercase italic mb-4">Message Received</h2>
          <p class="text-gray-500 mb-8 max-w-md mx-auto">Your inquiry has been securely transmitted. Our security experts will analyze your requirements and respond within 24 hours.</p>
          <button
            (click)="status.set('idle')"
            class="bg-brand-darkest hover:bg-brand-primary text-white font-bold uppercase tracking-widest px-8 py-3 rounded-xl transition-all"
          >
            Send Another Message
          </button>
        </div>
      </div>
    } @else {
      <div class="max-w-4xl mx-auto">
        <div class="bg-white rounded-[32px] md:rounded-[40px] shadow-2xl p-8 md:p-16 relative overflow-hidden border border-gray-100">
          <div class="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -mr-32 -mt-32"></div>
          <div class="absolute bottom-0 left-0 w-48 h-48 bg-brand-darkest/5 rounded-full -ml-24 -mb-24"></div>

          <div class="text-center mb-10 md:mb-12 relative z-10">
            <span class="text-brand-primary font-bold uppercase tracking-widest text-[10px]">Secure Support</span>
            <h2 class="text-3xl md:text-4xl font-black text-brand-darkest mt-2 uppercase italic tracking-tighter">Get a Free Security Audit</h2>
            <p class="text-gray-400 text-xs md:text-sm mt-4 italic">Our experts will contact you within 24 business hours.</p>
          </div>

          <form [formGroup]="contactForm" class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 relative z-10" (ngSubmit)="handleSubmit()">
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-brand-darkest tracking-widest ml-1">Your Full Name</label>
              <input
                type="text"
                formControlName="name"
                class="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary p-4 rounded-xl md:rounded-2xl outline-none transition-all text-sm font-semibold hover:bg-gray-100 placeholder:text-gray-300"
                placeholder="e.g. Alexander Shield"
              />
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-brand-darkest tracking-widest ml-1">Email Address</label>
              <input
                type="email"
                formControlName="email"
                class="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary p-4 rounded-xl md:rounded-2xl outline-none transition-all text-sm font-semibold hover:bg-gray-100 placeholder:text-gray-300"
                placeholder="e.g. contact@domain.com"
              />
            </div>

            <!-- Enhanced Phone Field with Country Flags -->
            <div class="space-y-2 md:col-span-1">
              <label class="text-[10px] font-black uppercase text-brand-darkest tracking-widest ml-1">Secure Contact Number</label>
              <div class="flex gap-3">
                <div class="relative w-32 flex-shrink-0">
                  <select
                    formControlName="countryCode"
                    class="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary p-4 rounded-xl md:rounded-2xl outline-none transition-all text-sm font-bold appearance-none cursor-pointer"
                  >
                    @for (c of countries; track c.code) {
                      <option [value]="c.dialCode">{{ c.flag }} {{ c.dialCode }}</option>
                    }
                  </select>
                  <i class="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 pointer-events-none"></i>
                </div>
                <div class="relative flex-grow">
                  <input
                    type="tel"
                    formControlName="phone"
                    (input)="onPhoneInput($event)"
                    maxlength="10"
                    class="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary p-4 rounded-xl md:rounded-2xl outline-none transition-all text-sm font-bold hover:bg-gray-100 placeholder:text-gray-300"
                    placeholder="10-digit number"
                  />
                  @if (contactForm.get('phone')?.touched && contactForm.get('phone')?.errors?.['pattern']) {
                    <span class="absolute -bottom-6 left-1 text-[8px] font-black uppercase text-red-500 tracking-widest animate-fade-in">Invalid Number (10 Digits Required)</span>
                  }
                </div>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-[10px] font-black uppercase text-brand-darkest tracking-widest ml-1">Inquiry Subject</label>
              <input
                type="text"
                formControlName="subject"
                class="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary p-4 rounded-xl md:rounded-2xl outline-none transition-all text-sm font-semibold hover:bg-gray-100 placeholder:text-gray-300"
                placeholder="e.g. Product Specification Inquiry"
              />
            </div>
            <div class="space-y-2 md:col-span-2">
              <label class="text-[10px] font-black uppercase text-brand-darkest tracking-widest ml-1">Detailed Message</label>
              <textarea
                rows="4"
                formControlName="message"
                class="w-full bg-gray-50 border-2 border-transparent focus:border-brand-primary p-4 rounded-xl md:rounded-2xl outline-none transition-all text-sm font-semibold resize-none hover:bg-gray-100 placeholder:text-gray-300"
                placeholder="Tell us about your security needs..."
              ></textarea>
            </div>

            @if (status() === 'error') {
              <div class="md:col-span-2 bg-red-50 text-red-600 p-4 rounded-xl text-center text-sm font-bold">
                <i class="fas fa-exclamation-circle mr-2"></i>
                Transmission failed. Please try again later.
              </div>
            }

            <div class="md:col-span-2">
              <button
                type="submit"
                [disabled]="status() === 'submitting' || contactForm.invalid"
                class="w-full bg-brand-darkest hover:bg-brand-primary text-white font-black uppercase tracking-widest py-4 md:py-5 rounded-xl md:rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                @if (status() === 'submitting') {
                  <span><i class="fas fa-spinner fa-spin mr-2"></i> Transmitting Securely...</span>
                } @else {
                  Initialize Connection
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    }
  `,
  styles: []
})
export class CommonContactFormComponent implements OnInit {
  contactForm: FormGroup;
  status = signal<'idle' | 'submitting' | 'success' | 'error'>('idle');

  countries: Country[] = [
    { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
    { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
    { code: 'AE', name: 'UAE', flag: '🇦🇪', dialCode: '+971' },
    { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61' },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1' },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49' },
    { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81' },
    { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {
    this.contactForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      countryCode: ['+91', Validators.required],
      phone: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      subject: [''],
      message: ['', Validators.required]
    });
  }

  ngOnInit() { }

  onPhoneInput(event: any) {
    const val = event.target.value.replace(/[^0-9]/g, '');
    this.contactForm.patchValue({ phone: val.slice(0, 10) }, { emitEvent: false });
  }

  async handleSubmit() {
    if (this.contactForm.invalid) return;

    this.status.set('submitting');

    try {
      const fullData = {
        ...this.contactForm.value,
        phone: `${this.contactForm.value.countryCode} ${this.contactForm.value.phone}`
      };

      const success = await this.apiService.sendContactMessage(fullData);

      if (success) {
        this.status.set('success');
        this.contactForm.reset({ countryCode: '+91' });
      } else {
        this.status.set('error');
      }
    } catch (error) {
      this.status.set('error');
    }
  }
}
