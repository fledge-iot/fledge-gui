import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PackagesLogComponent } from './packages-log.component';

describe('PackagesLogComponent', () => {
  let component: PackagesLogComponent;
  let fixture: ComponentFixture<PackagesLogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PackagesLogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PackagesLogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
