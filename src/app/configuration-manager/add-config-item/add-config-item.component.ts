import { Component, OnInit, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { AlertService } from '../../services/index';

@Component({
  selector: 'app-add-config-item',
  templateUrl: './add-config-item.component.html',
  styleUrls: ['./add-config-item.component.css']
})
export class AddConfigItemComponent implements OnInit {
  public catName = '';
  public scheduleType = [];
  public days = [];

  @Input() childData: { cat_name: any, key: any };
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  form: FormGroup;

  constructor( public fb: FormBuilder, private alertService: AlertService) { }

  ngOnInit() { }

  ngOnChanges(changes: SimpleChanges) {
    this.form = this.fb.group({
      cat_name: [Validators.required],
      desc: [Validators.required],
      default_value: [Validators.required],
      type: [Validators.required],
    });

    if (changes['childData']) {
      this.catName = this.childData.cat_name;
    }
  }

  public toggleModal(isOpen: Boolean) {
    let modal = <HTMLDivElement>document.getElementById('add-config-item');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

}
