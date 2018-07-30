import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RestartModalComponent } from './restart-modal.component';

describe('RestartModalComponent', () => {
  let component: RestartModalComponent;
  let fixture: ComponentFixture<RestartModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RestartModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RestartModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
