import { ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, FormGroupDirective } from '@angular/forms';
import { filter } from 'lodash';
import { CustomValidator } from '../../../../directives/custom-validator';

@Component({
  selector: 'app-list-type-configuration',
  templateUrl: './list-type-configuration.component.html',
  styleUrls: ['./list-type-configuration.component.css']
})
export class ListTypeConfigurationComponent implements OnInit {
  @Input() configuration;
  @Output() formState = new EventEmitter<boolean>();
  form: FormGroup;
  listItemsForm: FormGroup;

  constructor(
    public cdRef: ChangeDetectorRef,
    private rootFormGroup: FormGroupDirective,
    private fb: FormBuilder) {
    this.listItemsForm = this.fb.group({
      listItems: this.fb.array([])
    })
  }

  ngOnInit() {
    console.log('list item', this.configuration);
    this.form = this.rootFormGroup.control;
    // console.log('form', this.form);
    let val = this.configuration?.value ? this.configuration.value : this.configuration.default;
    val = JSON.parse(val) as [];
    console.log('val ', val);
    for (let i = 0; i < val.length; i++) {
      const element = val[i];
      this.initListItem(element);
    }
    this.onValChanges();
  }

  // ngAfterViewInit() {
  //   console.log("form status", this.listItems.invalid);
  //   if (this.listItems.invalid) {
  //     console.log("parent form 123 ", this.configuration.key, this.form.controls[this.configuration.key]);
  //     const control = this.form.controls[this.configuration.key];
  //     control.valueChanges.subscribe(() => {
  //       control.setErrors({ invalid: true });
  //       control.updateValueAndValidity();
  //       this.cdRef.detectChanges();
  //     });
  //   }
  //   console.log("parent form ", this.form);
  //   //this.formState.emit(this.listItems.valid);
  // }

  get listItems() {
    return this.listItemsForm.get('listItems') as FormArray;
  }

  initListItem(v = '') {
    const listItem = new FormControl(v, [CustomValidator.nospaceValidator]);
    this.listItems.push(listItem);
  }

  addListItem() {
    const controlsLength = this.listItems.length;
    const listSize = +this.configuration?.listSize;
    // console.log('list size', listSize);
    // console.log('list controlLength', controlsLength);
    if (controlsLength < listSize) {
      this.initListItem();
    }
  }


  removeListItem(index: number) {
    this.listItems.removeAt(index);
    // console.log(this.listItems.value);
  }

  onValChanges(): void {
    this.listItems.valueChanges.subscribe((val) => {
      val = filter(val)

      console.log('main form value', this.listItemsForm);
      this.form.get(this.configuration.key)?.patchValue(JSON.stringify(val))

      // this.formState.emit(this.listItems.valid);
    })
  }
}
