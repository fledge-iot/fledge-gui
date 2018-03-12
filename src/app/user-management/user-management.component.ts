import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AlertService, AuthService, UserService } from '../services/index';
import { SharedService } from './../services/shared.service';
import { NgProgress } from 'ngx-progressbar';
import { ModalComponent } from './../modal/modal.component';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit {

  private userRecord;
  @ViewChild(ModalComponent) child: ModalComponent;

  // Object to hold schedule id and name to delete
  public childData = {};
  constructor(private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private alertService: AlertService,
    private sharedService: SharedService,
    private userService: UserService,
    public ngProgress: NgProgress) { }


  ngOnInit() {
    this.getLoggedInUser();
  }

  getLoggedInUser() {
    this.ngProgress.start();
    // get loggedin user token from session
    const token = sessionStorage.getItem('token');
    // Get SignedIn user details
    this.userService.getWhoAmi(token)
      .subscribe(
        userData => {
          this.getRole(userData.users);
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

  getRole(users) {
    this.userService.getRole()
      .subscribe(
        roleRecord => {
          this.ngProgress.done();
          roleRecord.roles.filter(role => {
            users.forEach(user => {
              if (role.id == user.roleId) {
                user['roleName'] = role.name
              }
            })
          })
          this.userRecord = users;
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

  /**
  * Open delete record modal dialog
  * @param id   schedule id to delete
  * @param name schedule name
  */
  openModal(id, name, message) {
    this.childData = {
      id: id,
      name: name,
      message: message,
      key: 'deleteUser'
    };
    // call child component method to toggle modal
    this.child.toggleModal(true);
  }

  deleteUser(userId) {
    console.log('Deleting User:', userId);
    /** request started */
    this.ngProgress.start();
    this.userService.deleteUser(userId).
      subscribe(
        data => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data.message);
          this.getLoggedInUser();
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
}
