import { Component, OnInit } from '@angular/core';
import { NgProgress } from 'ngx-progressbar';
import { AlertService, AuthService, UserService } from '../../services/index';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  public userRecord = [];
  constructor(private authService: AuthService,
    private alertService: AlertService,
    private userService: UserService,
    public ngProgress: NgProgress, ) { }

  ngOnInit() {
    this.getUser()
  }

  getUser() {
    this.userRecord = [];
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
                this.userRecord.push(userData);
                console.log("logged in user data", this.userRecord);
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


  //   getRole(id) {
  //     this.userService.getRole()
  //       .subscribe(
  //         roleRecord => {
  //           this.ngProgress.done();
  //           roleRecord.roles.filter(role => {
  //           //   users.forEach(user => {
  //           //     if (role.id == user.roleId) {
  //           //       user['roleName'] = role.name
  //           //     }
  //           //   })
  //           // })
  //           // this.userRecord = users;
  //         },
  //         error => {
  //           /** request completed */
  //           this.ngProgress.done();
  //           if (error.status === 0) {
  //             console.log('service down ', error);
  //           } else {
  //             this.alertService.error(error.statusText);
  //           };
  //         });
  //   }
  // }
}
