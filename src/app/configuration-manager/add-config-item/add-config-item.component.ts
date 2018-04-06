import { Component, OnInit, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService } from '../../services/index';

enum type {
boolean,
integer,
string,
IPv4,
IPv6,
X509certificate,
password,
JSON
}

@Component({
  selector: 'app-add-config-item',
  templateUrl: './add-config-item.component.html',
  styleUrls: ['./add-config-item.component.css']
})
export class AddConfigItemComponent implements OnInit {
  public catName = '';
  public categoryData: any;
  configItemType = [];

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private alertService: AlertService) { }

  ngOnInit() {
    this.configItemType = ['boolean','integer','string','IPv4','IPv6','X509 certificate','password','JSON'];
    this.categoryData = {
      categoryName: '',
      key: '',
      description: '',
      defaultValue: '',
      type: 'none'
    }
  }

  public setConfigName(desc, key) {
    this.categoryData = {
      categoryName: desc,
      key: key
    }
    console.log('setConfigName', this.categoryData);
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      this.resetCreateUserForm(form)
    }
    let modal = <HTMLDivElement>document.getElementById('add-config-item');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

  public resetCreateUserForm(form: NgForm) {
    form.resetForm(); 
  }

}
