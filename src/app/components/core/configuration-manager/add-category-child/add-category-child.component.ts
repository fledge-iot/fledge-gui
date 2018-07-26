import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-add-category-child',
  templateUrl: './add-category-child.component.html',
  styleUrls: ['./add-category-child.component.css']
})
export class AddCategoryChildComponent implements OnInit {
  public categoryData: any;

  constructor() { }

  ngOnInit() {
    this.categoryData = {
      parentCategory: ''
    };
  }

  public setCategoryData(key) {
    this.categoryData = {
      parentCategory: key
    };
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      this.resetAddConfigItemForm(form);
    }
    const modal = <HTMLDivElement>document.getElementById('add-category-child');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

  public resetAddConfigItemForm(form: NgForm) {
    form.resetForm();
  }
}
