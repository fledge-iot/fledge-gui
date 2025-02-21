import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KvlistCardComponent } from './kvlist-card.component';

describe('KvlistCardComponent', () => {
  let component: KvlistCardComponent;
  let fixture: ComponentFixture<KvlistCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KvlistCardComponent]
    });
    fixture = TestBed.createComponent(KvlistCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
