import { Component, EventEmitter, OnInit, Output, HostListener, Input, OnChanges } from '@angular/core';

import { User } from '../../../../models';
import { AlertService, UserService } from '../../../../services';

@Component({
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css']
})
export class UpdateUserComponent implements OnInit, OnChanges {
  public userRecord: User;
  userRole = [];
  @Output() notify: EventEmitter<any> = new EventEmitter<any>();
  @Input() userRoles: any;

  showRoleSection = false;
  selectedRole = 'user'; // set "user" as a default role

  constructor(private alertService: AlertService,
    private userService: UserService) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  ngOnInit() {
    this.userRecord = {
      userId: 0,
      username: '',
      password: '',
      confirmPassword: '',
      role_id: 0   // set "user" as a default role
    };
  }

  ngOnChanges(): void {
    this.userRole = this.userRoles;
  }



  /**
   * TO get data from parent component
   * @param userRecord  User model
   * @param key  key to show/hide particular section on UI
   */
  public setUser(userRecord, key) {
    this.setUserRole({ id: userRecord.roleId, name: userRecord.roleName });
    this.showRoleSection = false;
    this.userRecord = {
      userId: userRecord.userId,
      username: userRecord.userName,
      password: '',
      confirmPassword: '',
      role_id: userRecord.roleId  // to set default value in role option
    };

    // To handle section on UI
    if (key === 'role') {
      this.showRoleSection = true;
    }
  }

  public toggleModal(isOpen: Boolean) {
    const updateUserModal = <HTMLDivElement>document.getElementById('update_user_modal');
    if (isOpen) {
      updateUserModal.classList.add('is-active');
      return;
    }
    updateUserModal.classList.remove('is-active');
    const activeDropDown = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDown.length > 0) {
      activeDropDown[0].classList.remove('is-active');
    }
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
        (data) => {
          this.notify.emit();
          this.toggleModal(false);
          this.alertService.success(data['message']);
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
        (data) => {
          this.notify.emit();
          this.toggleModal(false);
          this.alertService.success(data['message']);
        },
        error => {
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  public toggleDropDown(id: string) {
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  public setUserRole(role: any) {
    this.selectedRole = role.name;
    this.userRecord.role_id = role.id;
  }
}
