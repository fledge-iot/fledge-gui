import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageVisualisationComponent } from './image-visualisation.component';

describe('ImageVisualisationComponent', () => {
  let component: ImageVisualisationComponent;
  let fixture: ComponentFixture<ImageVisualisationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImageVisualisationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ImageVisualisationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
