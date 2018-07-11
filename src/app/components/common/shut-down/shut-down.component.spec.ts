import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ShutdownModalComponent } from './shutdown-modal.component';

describe('ShutdownModalComponent', () => {
  let component: ShutdownModalComponent;
  let fixture: ComponentFixture<ShutdownModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShutdownModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShutdownModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
