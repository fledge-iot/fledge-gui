import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { AlertService, ConfigurationService } from '../../../../services';

@Component({
  selector: 'app-add-category-child',
  templateUrl: './add-category-child.component.html',
  styleUrls: ['./add-category-child.component.css']
})
export class AddCategoryChildComponent implements OnInit {
  public parentCategoriesList;
  public childCategoriesList;
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

  private getAllCategories(): void {
    this.configService.getCategories().
      subscribe(
        (data) => {
          this.parentCategoriesList = data['categories'];
          this.parentCategory = this.parentCategoriesList[0]['key'];
          this.childCategoriesList = this.parentCategoriesList.filter(element => element.key !== this.parentCategory);
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
      form.controls['childCategories'].reset();
    }
    const modal = <HTMLDivElement>document.getElementById('add-category-child');
    if (isOpen) {
      modal.classList.add('is-active');
      return;
    }
    modal.classList.remove('is-active');
  }

  public changeParent(value) {
    this.childCategoriesList = this.parentCategoriesList.filter(el => el.key !== value);
  }

  public addChild(form: NgForm) {

    const parent = form.controls['parentCategory'].value;
    const children = form.controls['childCategories'].value;
    this.configService
      .addChild(parent, children)
      .subscribe(() => {
        this.notify.emit();
        this.toggleModal(false, null);
        this.alertService.success('Children have been added successfully');
        if (form != null) {
          form.controls['parentCategory'].reset(this.parentCategory);
          form.controls['childCategories'].reset();
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
