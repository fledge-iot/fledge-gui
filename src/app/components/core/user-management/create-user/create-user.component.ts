import { Component, OnInit, EventEmitter, Input, Output, Directive } from '@angular/core';
import { UserService, AlertService } from '../../../../services/index';
import Utils from '../../../../utils';
import { User } from '../../../../models';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit {
  model: User;
  isUpdateForm = false;
  userRole = [];
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private userService: UserService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.getRole();
    this.model = {
      userId: 0,
      username: '',
      password: '',
      confirmPassword: '',
      role_id: 2   // set "user" as a default role
    };
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      this.resetCreateUserForm(form);
    }
    const createUserModal = <HTMLDivElement>document.getElementById('user_modal');
    if (isOpen) {
      createUserModal.classList.add('is-active');
      return;
    }
    this.isUpdateForm = false;
    createUserModal.classList.remove('is-active');
  }

  public createUser(form: NgForm) {
    this.userService.createUser(this.model).
      subscribe(
        data => {
          this.notify.emit();
          this.toggleModal(false, null);
          this.alertService.success(data.message);
          if (form != null) {
            this.resetCreateUserForm(form);
          }
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getRole() {
    this.userService.getRole()
      .subscribe(
        roleRecord => {
          this.userRole = roleRecord.roles;
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public resetCreateUserForm(form: NgForm) {
    form.resetForm();
    this.getRole();
  }

  setRole(value) {
    const role = this.userRole.find(r => r.id = value);
    if (role) { this.model.role_id = role.id; }
  }
}
