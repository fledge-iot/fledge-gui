import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { JsonEditorComponent } from './json-editor.component';



@NgModule({
  declarations: [
    JsonEditorComponent
  ],
  imports: [
    ReactiveFormsModule,
    FormsModule,
    CommonModule
  ],
  providers: [],
  exports: [JsonEditorComponent]
})
export class JsonEditorModule { }
