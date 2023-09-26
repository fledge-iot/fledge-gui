import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';

import { AlertService, AuthService, UserService, ProgressBarService, SharedService, RolesService } from '../../../services';
import { AlertDialogComponent } from '../../common/alert-dialog/alert-dialog.component';
import { CreateUserComponent } from './create-user/create-user.component';
import { UpdateUserComponent } from './update-user/update-user.component';
import { Subscription } from 'rxjs';

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
  seletedTab: Number = 1;  // 1: user-management , 2 : roles
  private viewPortSubscription: Subscription;
  viewPort: any = '';

  constructor(private authService: AuthService,
    private alertService: AlertService,
    private userService: UserService,
    public ngProgress: ProgressBarService,
    private sharedService: SharedService,
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
    switch (accessMethod) {
      case 'cert':
        return 'Certificate';
        break;
      case 'pwd':
        return 'Password';
        break;
      default:
        return 'Any';
        break;
    }
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
    this.seletedTab = 1;
    if (id === 2) {
      this.seletedTab = id;
    }
  }

  setRoleName(roleId: number) {
    return this.roleService.getRoleName(roleId);
  }

  public ngOnDestroy(): void {
    this.viewPortSubscription.unsubscribe();
  }
}
