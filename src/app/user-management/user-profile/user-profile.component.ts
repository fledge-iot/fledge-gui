import { Component, OnInit, ViewChild } from '@angular/core';
import { NgProgress } from 'ngx-progressbar';
import { AlertService, AuthService, UserService } from '../../services/index';
import { ModalComponent } from '../../modal/modal.component';
import { Router } from '@angular/router';
import { NgForm } from '@angular/forms';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  public userRecord: any = {};
  public childData = {};
  isShow: boolean = false;
  @ViewChild(ModalComponent) child: ModalComponent;

  constructor(private authService: AuthService,
    private alertService: AlertService,
    private userService: UserService,
    public ngProgress: NgProgress,
    private router: Router) { }

  ngOnInit() {
    this.getUser()
  }

  getUser() {
    this.userRecord = {};
    this.ngProgress.start();
    let id = sessionStorage.getItem('uid');
    // Get SignedIn user details
    this.userService.getUser(id)
      .subscribe(
        userData => {
          this.userService.getRole()
            .subscribe(
              roleRecord => {
                this.ngProgress.done();
                roleRecord.roles.filter(role => {
                  if (role.id == userData.roleId) {
                    userData['roleName'] = role.name
                  }
                })
                this.userRecord = {
                  userId: userData['userId'],
                  userName: userData['userName'],
                  roleId: userData['roleId'],
                  roleName: userData['roleName'],
                };
              },
              error => {
                this.ngProgress.done();
                if (error.status === 0) {
                  console.log('service down ', error);
                } else {
                  this.alertService.error(error.statusText);
                };
              });
        },
        error => {
          /** request completed */
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down ', error);
          } else {
            this.alertService.error(error.statusText);
          };
        });
  }

  updateUser(form: NgForm) {
    this.ngProgress.start();
    this.userService.updateUser(this.userRecord).
      subscribe(
        data => {
          this.ngProgress.done();
          this.alertService.success(data.message);
          if (form != null) {
            this.resetUserForm(form)
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

  public resetUserForm(form: NgForm) {
    form.controls["oldPassword"].reset();
    form.controls["password"].reset();
    form.controls["confirmPassword"].reset();
    this.isShow = false;
  }

  public toggleModal(isOpen: Boolean) {
    let userProfileModal = <HTMLDivElement>document.getElementById('user_profile_modal');
    if (isOpen) {
      userProfileModal.classList.add('is-active');
      return;
    }
    userProfileModal.classList.remove('is-active');
  }

  changePassword(form: NgForm, userName) {
    let passwordPayload: any = {
      current_password: form.controls["oldPassword"].value,
      new_password: form.controls["password"].value
    }
    this.ngProgress.start();
    this.userService.changePassword(passwordPayload, userName).
      subscribe(
        data => {
          this.ngProgress.done();
          this.alertService.success(data.message);
          if (form != null) {
            this.toggleModal(false);
            this.resetUserForm(form)
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
    *  @param id  user id
    */
  clearAllSessions(id) {
    this.ngProgress.start();
    this.authService.clearAllSessions(id).
      subscribe(
        data => {
          this.ngProgress.done();
          this.alertService.success('All active sessions cleared');
          this.router.navigate(['/login']);
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
}
