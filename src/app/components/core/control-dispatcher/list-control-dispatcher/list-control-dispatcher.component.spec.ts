import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ListControlDispatcherComponent } from './list-control-dispatcher.component';

describe('ListControlDispatcherComponent', () => {
  let component: ListControlDispatcherComponent;
  let fixture: ComponentFixture<ListControlDispatcherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ListControlDispatcherComponent]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ListControlDispatcherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
