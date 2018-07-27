import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService, ConfigurationService } from '../../../../services';

@Component({
  selector: 'app-add-category-child',
  templateUrl: './add-category-child.component.html',
  styleUrls: ['./add-category-child.component.css']
})
export class AddCategoryChildComponent implements OnInit {
  public categoryData: any;

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private configService: ConfigurationService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.categoryData = {
      parentCategory: '',
      child: ''
    };
  }

  public setCategoryData(key) {
    this.categoryData = {
      parentCategory: key
    };
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      this.resetAddChildForm(form);
    }
    const modal = <HTMLDivElement>document.getElementById('add-category-child');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

  public resetAddChildForm(form: NgForm) {
    form.resetForm();
  }

  public addChild(form: NgForm) {
    const parent = form.controls['parentCategory'].value;
    const child = [];
    child.push(form.controls['child'].value) ;
    this.configService
      .addChild(parent, child)
      .subscribe(() => {
          this.notify.emit(this.categoryData);
          this.toggleModal(false, null);
          this.alertService.success('Children has been added successfully');
          if (form != null) {
            this.resetAddChildForm(form);
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        }
      );
  }
}
