import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PluginModalComponent } from './plugin-modal.component';

describe('PluginModalComponent', () => {
  let component: PluginModalComponent;
  let fixture: ComponentFixture<PluginModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PluginModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PluginModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
