import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { NgForm } from '@angular/forms';
import { User } from '../../../../models';
import { AlertService, AuthService, UserService } from '../../../../services/index';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css']
})
export class UpdateUserComponent implements OnInit {
  public userRecord: User;
  userRole = [];
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  showRoleSection = false;

  constructor(private authService: AuthService,
    private alertService: AlertService,
    private userService: UserService) { }

  ngOnInit() {
    this.getRole();
    this.userRecord = {
      userId: 0,
      username: '',
      password: '',
      confirmPassword: '',
      role_id: 2   // set "user" as a default role
    };
  }

  /**
   * TO get data from parent component
   * @param userRecord  User model
   * @param key  key to show/hide particular section on UI
   */
  public setUser(userRecord, key) {
    this.showRoleSection = false;
    this.userRecord = {
      userId: userRecord.userId,
      username: userRecord.userName,
      password: '',
      confirmPassword: '',
      role_id: userRecord.roleId  // to set default value in role option
    };

    // To handle section on UI
    if (key == 'role') {
      this.showRoleSection = true;
    }
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    const updateUserModal = <HTMLDivElement>document.getElementById('update_user_modal');
    if (isOpen) {
      updateUserModal.classList.add('is-active');
      return;
    }
    updateUserModal.classList.remove('is-active');
  }

  /**
   *  Get all roles
   */
  getRole() {
    this.userService.getRole()
      .subscribe(
        roleRecord => {
          console.log('Role', roleRecord.roles);
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

  /**
   *  To handle role and password change method call
   */
  updateUser() {
    if (this.showRoleSection) {
      this.updateRole();
    } else {
      this.resetPassword();
    }
  }

  /**
   *  To update user role by admin
   */
  updateRole() {
    this.userService.updateRole(this.userRecord).
      subscribe(
        data => {
          this.notify.emit();
          this.toggleModal(false, null);
          this.alertService.success(data.message);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }


  /**
    *  To reset user password by admin
    */
  resetPassword() {
    this.userService.resetPassword(this.userRecord).
      subscribe(
        data => {
          this.notify.emit();
          this.toggleModal(false, null);
          this.alertService.success(data.message);
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
