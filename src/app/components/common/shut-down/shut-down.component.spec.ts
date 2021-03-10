import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShutdownModalComponent } from './shutdown-modal.component';

describe('ShutdownModalComponent', () => {
  let component: ShutdownModalComponent;
  let fixture: ComponentFixture<ShutdownModalComponent>;

  beforeEach(waitForAsync(() => {
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
