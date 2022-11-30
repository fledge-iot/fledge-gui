import { Component, EventEmitter, OnInit, Output, HostListener, Input, OnChanges } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
  authMethods = [];

  showRoleSection = false;
  updateSection = 'pwd';
  selectedRole = 'user'; // set "user" as a default role
  selectedAuthMethod;
  isFieldChanged = false;

  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private alertService: AlertService,
    private userService: UserService) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  ngOnInit() {
    this.userRecord = {
      userId: 0,
      username: '',
      description: '',
      password: '',
      real_name: '',
      access_method: '',
      confirmPassword: '',
      role_id: 0   // set "user" as a default role
    };
    this.authMethods = [{ text: 'Any', value: 'any' }, { text: 'Password', value: 'pwd' }, { text: 'Certificate', value: 'cert' }];
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
    this.isFieldChanged = false;
    this.setUserRole({ id: userRecord.roleId, name: userRecord.roleName });
    const authMethod = this.authMethods.find(object => object.value === userRecord.accessMethod);
    this.setAuthMethod(authMethod);
    this.updateSection = 'password';
    this.userRecord = {
      userId: userRecord.userId,
      username: userRecord.userName,
      real_name: userRecord.realName,
      access_method: userRecord.authMethod,
      description: userRecord.description,
      password: '',
      confirmPassword: '',
      role_id: userRecord.roleId  // to set default value in role option
    };
    this.updateSection = key;
  }

  public resetUserForm(form: NgForm) {
    form.reset();
  }

  public toggleModal(isOpen: Boolean, form: NgForm = null) {
    const updateUserModal = <HTMLDivElement>document.getElementById('update_user_modal');
    if (isOpen) {
      updateUserModal.classList.add('is-active');
      return;
    }
    updateUserModal.classList.remove('is-active');
    this.resetUserForm(form);
    const activeDropDown = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDown.length > 0) {
      activeDropDown[0].classList.remove('is-active');
    }
  }

  /**
   *  To handle role and password change method call
   */
  updateUser(form: NgForm) {
    switch (this.updateSection) {
      case 'password':
        this.resetPassword(form);
        break;
      case 'role':
        this.updateRole(form);
        break;
      case 'auth':
        this.updateAuthMethod(form);
        break;
      default:
        break;
    }
  }

  updateAuthMethod(form: NgForm) {
    this.userService.updateUser(this.userRecord)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.notify.emit();
        this.toggleModal(false, form);
        this.alertService.success('User updated successfully');
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
   *  To update user role by admin
   */
  updateRole(form: NgForm) {
    const payload = {
      userId: this.userRecord.userId,
      role_id: this.userRecord.role_id
    }
    this.userService.updateRole(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.notify.emit();
          this.toggleModal(false, form);
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
  resetPassword(form: NgForm) {
    if (this.userRecord.password !== this.userRecord.confirmPassword) {
      return;
    }
    this.userService.resetPassword(this.userRecord)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (data) => {
          this.notify.emit();
          this.toggleModal(false, form);
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
    this.isFieldChanged = true;
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

  public setAuthMethod(auth: any) {
    this.selectedAuthMethod = auth.text;
    this.userRecord.access_method = auth.value;
  }

  public ngOnDestroy(): void {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
