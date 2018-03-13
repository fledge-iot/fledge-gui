import { Component, OnInit, EventEmitter, Input, Output, Directive } from '@angular/core';
import { UserService, AlertService } from '../../services/index';
import Utils from '../../utils';
import { User } from '../../models';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrls: ['./create-user.component.css']
})
export class CreateUserComponent implements OnInit {
  model: User;
  isUpdateForm = false;
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();

  constructor(private userService: UserService,
    private alertService: AlertService) { }

  ngOnInit() {
    this.model = {
      user_id: 0,
      username: '',
      password: '',
      confirmPassword: '',
      role_id: 1   // to set default value in role option
    }
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      form.resetForm({ role: 1 })
    }
    let createUserModal = <HTMLDivElement>document.getElementById('user_modal');
    if (isOpen) {
      createUserModal.classList.add('is-active');
      return;
    }
    this.isUpdateForm = false;
    createUserModal.classList.remove('is-active');
  }

  public createUser(form: NgForm) {
    let token = sessionStorage.getItem('token');
    this.userService.createUser(this.model, token).
      subscribe(
        data => {
          this.notify.emit();
          this.toggleModal(false, null);
          this.alertService.success(data.message);
          if (form != null) {
            form.resetForm({ role: 1 })
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
}
