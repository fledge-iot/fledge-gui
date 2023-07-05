import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddDispatcherServiceComponent } from './add-dispatcher-service.component';

describe('AddDispatcherServiceComponent', () => {
  let component: AddDispatcherServiceComponent;
  let fixture: ComponentFixture<AddDispatcherServiceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddDispatcherServiceComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AddDispatcherServiceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
