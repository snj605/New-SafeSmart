import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CommonContactForm } from './common-contact-form';

describe('CommonContactForm', () => {
  let component: CommonContactForm;
  let fixture: ComponentFixture<CommonContactForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommonContactForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CommonContactForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
