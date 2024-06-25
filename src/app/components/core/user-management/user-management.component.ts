import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { AlertService, AuthService, UserService, ProgressBarService, SharedService, RolesService } from '../../../services';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { UpdateUserComponent } from './update-user/update-user.component';
import { Subscription } from 'rxjs';
import { DateFormatterPipe } from '../../../pipes';
import { User } from '../../../models';
import moment from 'moment';

@Component({
  selector: 'app-user-management',
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.css']
})
export class UserManagementComponent implements OnInit, OnDestroy {

  @ViewChild(AlertDialogComponent, { static: true }) child: AlertDialogComponent;
  @ViewChild(CreateUserComponent, { static: true }) createUserModal: CreateUserComponent;
  @ViewChild(UpdateUserComponent, { static: true }) updateUserModal: UpdateUserComponent;

  // Object to hold user record
  public childData = {};
  public userRecord;
  public uid: string;
  public roles = [];
  selectedTab: Number = 1;  // 1: user-management , 2 : roles
  private viewPortSubscription: Subscription;
  viewPort: any = '';

  constructor(private authService: AuthService,
    private alertService: AlertService,
    private userService: UserService,
    public ngProgress: ProgressBarService,
    private sharedService: SharedService,
    private dateFormatter: DateFormatterPipe,
    private roleService: RolesService
  ) { }

  ngOnInit() {
    this.uid = sessionStorage.getItem('uid');
    this.getUsers();
    this.viewPortSubscription = this.sharedService.viewport.subscribe(viewport => {
      this.viewPort = viewport;
    });
  }

  getUsers() {
    this.ngProgress.start();
    this.userService.getAllUsers()
      .subscribe(
        (userData) => {
          /** request completed */
          this.ngProgress.done();
          this.getRole(userData['users']);
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

  getRole(users) {
    this.ngProgress.start();
    this.userService.getRole()
      .subscribe(
        (roleRecord) => {
          this.roles = roleRecord['roles'].sort((a, b) => a.name.localeCompare(b.name));
          roleRecord['roles'].filter(role => {
            users.forEach(user => {
              if (role.id === user.roleId) {
                user['roleName'] = this.roleService.getRoleName(role.id);
              }
            });
          });
          this.userRecord = users.sort();
          this.userRecord = this.userRecord.map((user: User) => {
            if (user.blockUntil) {
              user.blockUntil = this.calculateBlockUserTime(user.blockUntil);
            }
            return user;
          })

          this.ngProgress.done();
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

  calculateBlockUserTime(time: string): string {
    const blockUntilTime = this.dateFormatter.transform(time, 'YYYY-MM-DD HH:mm:ss');
    const blockUntilTimestamp = moment(blockUntilTime);
    let timeDifference = blockUntilTimestamp.fromNow();
    timeDifference = timeDifference.toString().replace('in', 'for')
    return timeDifference;
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
  * To reload list of all users after deletion of a user
  * @param notify
  */
  onNotify() {
    this.getUsers();
  }

  /**
  * Open create user modal dialog
  */
  openCreateUserModal() {
    // call child component method to toggle modal
    this.createUserModal.toggleModal(true);
  }

  openUpdateUserModal(user, key) {
    this.updateUserModal.setUser(user, key);
    // call child component method to toggle modal
    this.updateUserModal.toggleModal(true);
  }

  action(userData: any) {
    if (userData.key == 'deactivateUser') {
      this.deleteUser(userData.id);
    } else if (userData.key == 'enableUser') {
      this.enableUser(userData.id);
    } else if (userData.key == 'clearSessions') {
      this.clearAllSessions(userData.key);
    } else if (userData.key == 'unblockUser') {
      this.unblockUser(userData.id);
    }
  }

  deleteUser(userId) {
    console.log('Deleting User:', userId);
    /** request started */
    this.ngProgress.start();
    this.userService.deleteUser(userId).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message']);
          this.getUsers();
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

  // TODO: FOGL-5381
  enableUser(userId) {
    console.log('userId', userId);
    // const payload = {
    //   enabled: true
    // };
    // /** request started */
    // this.ngProgress.start();
    // this.userService.enableUser(userId, payload).
    //   subscribe(
    //     (data) => {
    //       /** request completed */
    //       this.ngProgress.done();
    //       this.alertService.success(data['message']);
    //       this.getUsers();
    //     },
    //     error => {
    //       /** request completed */
    //       this.ngProgress.done();
    //       if (error.status === 0) {
    //         console.log('service down ', error);
    //       } else {
    //         this.alertService.error(error.statusText);
    //       }
    //     });
  }

  unblockUser(userId: string) {
    /** request started */
    this.ngProgress.start();
    this.userService.unblockUser(userId).
      subscribe(
        (data) => {
          /** request completed */
          this.ngProgress.done();
          this.alertService.success(data['message']);
          this.getUsers();
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

  public toggleDropdown(contextMenu) {
    const id = 'dropdown-' + contextMenu;
    const activeDropDowns = Array.prototype.slice.call(document.querySelectorAll('.dropdown.is-active'));
    if (activeDropDowns.length > 0) {
      if (activeDropDowns[0].id !== id) {
        activeDropDowns[0].classList.remove('is-active');
      }
    }
    const dropDown = document.querySelector(`#${id}`);
    dropDown.classList.toggle('is-active');
  }

  /**
     *  Sign Out
     */
  clearAllSessions(id) {
    this.ngProgress.start();
    this.authService.clearAllSessions(id).
      subscribe(
        () => {
          this.ngProgress.done();
          this.alertService.success('All active sessions cleared');
        },
        error => {
          this.ngProgress.done();
          if (error.status === 0) {
            console.log('service down', error);
          } else {
            this.alertService.error('No active session found');
          }
        });
  }

  showDiv(id) {
    this.selectedTab = 1;
    if (id === 2) {
      this.selectedTab = id;
    }
  }

  setRoleName(roleId: number) {
    return this.roleService.getRoleName(roleId);
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }
}
