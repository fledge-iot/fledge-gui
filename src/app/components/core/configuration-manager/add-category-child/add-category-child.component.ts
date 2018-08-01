import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService, ConfigurationService } from '../../../../services';

@Component({
  selector: 'app-add-category-child',
  templateUrl: './add-category-child.component.html',
  styleUrls: ['./add-category-child.component.css']
})
export class AddCategoryChildComponent implements OnInit {
  public parentCategories;
  public childCategories;
  public parentCategory;
  public selectedChildren: string[] = [];

  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    private configService: ConfigurationService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.getAllCategories();
  }

  public getChildren(categoryName) {
    this.configService.getChildren(categoryName).
      subscribe(
        (data: any) => {
          data['categories'].forEach(el => {
            const index = this.childCategories.findIndex(item => item.key === el.key);
            this.childCategories.splice(index, 1);
          });
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  private getAllCategories(): void {
    this.configService.getCategories().
      subscribe(
        (data) => {
          this.parentCategories = data['categories'];
          this.parentCategory = this.parentCategories[0]['key'];
          this.childCategories = this.parentCategories.filter(element => element.key !== this.parentCategory);
          this.getChildren(this.parentCategory);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      form.controls['parentCategory'].reset(this.parentCategory);
      form.controls['childCategory'].reset();
    }
    const modal = <HTMLDivElement>document.getElementById('add-category-child');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

  public changeParent(value) {
    this.childCategories = this.parentCategories.filter(el => el.key !== value);
    this.getChildren(value);
  }

  public addChild(form: NgForm) {
    const parent = form.controls['parentCategory'].value;
    const children = form.controls['childCategory'].value;
    this.configService
      .addChild(parent, children)
      .subscribe(() => {
        this.notify.emit();
        this.toggleModal(false, null);
        this.alertService.success('Children have been added successfully');
        if (form != null) {
          form.controls['parentCategory'].reset(this.parentCategory);
          form.controls['childCategory'].reset();
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
