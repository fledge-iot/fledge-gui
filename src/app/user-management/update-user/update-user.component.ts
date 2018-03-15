import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User } from '../../models';
import { AlertService, AuthService, UserService } from '../../services/index';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css']
})
export class UpdateUserComponent implements OnInit {
  public userRecord: User;
  userRole = [];
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  isShow = false;

  constructor(private authService: AuthService,
    private alertService: AlertService,
    private userService: UserService) { }

  ngOnInit() {
    this.getRole();
    this.userRecord = {
      user_id: 0,
      username: '',
      password: '',
      confirmPassword: '',
      role_id: 1   // to set default value in role option
    }
  }

  public setUser(userRecord) {
    this.userRecord = {
      user_id: userRecord.userId,
      username: userRecord.userName,
      password: '',
      confirmPassword: '',
      role_id: userRecord.roleId  // to set default value in role option
    }
    console.log('user', userRecord);
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    if (form != null) {
      form.resetForm({ role: 1 })
    }
    let updateUserModal = <HTMLDivElement>document.getElementById('update_user_modal');
    if (isOpen) {
      updateUserModal.classList.add('is-active');
      return;
    }
    updateUserModal.classList.remove('is-active');
  }

  getRole() {
    this.userService.getRole()
      .subscribe(
        roleRecord => {
          console.log('Role', roleRecord.roles);
          this.userRole = roleRecord.roles
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          };
        });
  }

  updateUser(form: NgForm) {
    this.userService.updateUser(this.userRecord).
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
