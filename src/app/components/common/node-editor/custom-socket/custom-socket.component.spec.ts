import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomSocketComponent } from './custom-socket.component';

describe('CustomSocketComponent', () => {
  let component: CustomSocketComponent;
  let fixture: ComponentFixture<CustomSocketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CustomSocketComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CustomSocketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
