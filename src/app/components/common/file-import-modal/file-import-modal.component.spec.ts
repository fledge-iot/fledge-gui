import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileImportModalComponent } from './file-import-modal.component';

describe('FileImportModalComponent', () => {
  let component: FileImportModalComponent;
  let fixture: ComponentFixture<FileImportModalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [FileImportModalComponent]
    });
    fixture = TestBed.createComponent(FileImportModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
