import { Component, OnInit, ViewChild, HostListener } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';

import { AlertService, AuthService, UserService, ProgressBarService, RolesService } from '../../../../services';
import { AlertDialogComponent } from '../../../common/alert-dialog/alert-dialog.component';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  public userRecord: any = {};
  public childData = {};
  isShow = false;
  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild('profileForm', { static: true }) profileForm: NgForm;

  constructor(private authService: AuthService,
    private alertService: AlertService,
    private userService: UserService,
    private roleService: RolesService,
    public ngProgress: ProgressBarService,
    private router: Router) { }

  @HostListener('document:keydown.escape', ['$event']) onKeydownHandler() {
    this.toggleModal(false);
  }

  ngOnInit() {
    this.getUser();
  }

  getUser() {
    this.userRecord = {};
    this.ngProgress.start();
    const id = sessionStorage.getItem('uid');
    // Get SignedIn user details
    this.userService.getUser(id)
      .subscribe(
        (userData) => {
          this.userService.getRole()
            .subscribe(
              (roleRecord) => {
                this.ngProgress.done();
                roleRecord['roles'].filter(role => {
                  if (role.id === userData['roleId']) {
                    userData['roleName'] = this.roleService.getRoleName(role.id);
                  }
                });
                this.userRecord = {
                  userId: userData['userId'],
                  userName: userData['userName'],
                  real_name: userData['realName'],
                  roleId: userData['roleId'],
                  roleName: userData['roleName'],
                  access_method: this.getAccessMethod(userData['accessMethod']),
                  description: userData['description']
                };
              },
              error => {
                this.ngProgress.done();
                if (error.status === 0) {
                  console.log('service down ', error);
                } else {
                  this.alertService.error(error.statusText);
                }
              });
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  getAccessMethod(accessMethod) {
    let method;
    switch (accessMethod) {
      case 'cert':
        method = 'Certificate';
        break;
      case 'pwd':
        method = 'Password';
        break;
      default:
        method = 'Any';
        break;
    }
    return method;
  }

  public resetUserForm(form: NgForm) {
    form.controls['currentPassword'].reset();
    form.controls['password'].reset();
    form.controls['confirmPassword'].reset();
    this.isShow = false;
  }

  public toggleModal(isOpen: boolean) {
    const userProfileModal = <HTMLDivElement>document.getElementById('user_profile_modal');
    if (isOpen) {
      userProfileModal.classList.add('is-active');
      return;
    }
    userProfileModal.classList.remove('is-active');
  }

  public changePassword(form: NgForm, userId) {
    const passwordPayload: any = {
      current_password: form.controls['currentPassword'].value,
      new_password: form.controls['password'].value
    };
    this.ngProgress.start();
    this.userService.changePassword(passwordPayload, userId).
      subscribe(
        (data) => {
          this.ngProgress.done();
          this.alertService.success(data['message']);
          if (form != null) {
            this.toggleModal(false);
            this.resetUserForm(form);
          }
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  /**
  * Open delete record modal dialog
  * @param id   user id to delete
  * @param name user name
  */
  openModal(id, name, key, message) {
    this.childData = {
      id: id,
      name: name,
      key: key,
      message: message,
    };

    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  /**
    *  Sign Out
    *  @param data {key , id}
    */
  clearAllSessions(data: any) {
    const id = data.id
    this.ngProgress.start();
    this.authService.clearAllSessions(id).
      subscribe(
        () => {
          sessionStorage.clear();
          this.ngProgress.done();
          this.alertService.success('All active sessions cleared', true);
          this.router.navigate(['/login'], { replaceUrl: true });
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else if (error.status === 404) {
            this.alertService.error('No active session found');
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }

  update() {
    this.ngProgress.start();
    this.userService.updateMe(this.userRecord).
      subscribe(
        () => {
          this.ngProgress.done();
          this.alertService.success('User updated successfully');
          this.profileForm.form.markAsPristine();
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          }
        });
  }
}
