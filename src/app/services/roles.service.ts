import { Injectable } from '@angular/core';

enum appRoles { anonymous = 0, admin = 1, user = 2, view = 3, data_view = 4, control = 5 };

@Injectable({
  providedIn: 'root'
})
export class RolesService {
  // role names array for gui mapping
  private roleNames = [{ roleId: 1, name: "Administrator" }, { roleId: 2, name: "Editor" }, { roleId: 3, name: "Viewer" }, { roleId: 4, name: "Data Viewer" }, { roleId: 5, name: "Control" }];

  constructor() { }

  /**
   * To check if user is admin or anonymous
   */
  public hasAdminPermissionsOrAnonymousAllowed(): boolean {
    const roleId = Number(sessionStorage.getItem('roleId'));
    return [appRoles.admin, appRoles.anonymous].includes(roleId);
  }

  /**
   * To check if user, who has the add/edit permission
   * @returns true|false based on user role
   */
  public hasEditPermissions(): boolean {
    const roleId = Number(sessionStorage.getItem('roleId'));
    return [appRoles.admin, appRoles.user, appRoles.control, appRoles.anonymous].includes(roleId);
  }

  public hasControlAccess(): boolean {
    const roleId = Number(sessionStorage.getItem('roleId'));
    return [appRoles.admin, appRoles.control, appRoles.anonymous].includes(roleId);
  }

  public hadEditPermissionsOnConfigItem(allowedRoles: string[] = []) {
    try {
      const roleId = Number(sessionStorage.getItem('roleId'));
      const roleName = appRoles[roleId];
      const loginSkipped = JSON.parse(sessionStorage.getItem('LOGIN_SKIPPED'));
      return loginSkipped || roleName == 'admin' || allowedRoles.length == 0 || allowedRoles.includes(roleName);
    } catch (error) {
      console.log(error);
    }
  }

  hasEditPermissionsOnPage(page: string) {
    if (page == 'control-pipeline') {
      return this.hasControlAccess();
    } else {
      return this.hasEditPermissions()
    }
  }

  /**
   * To check if user have data_view role
   * @returns true|false based on user role
   */
  public hasDataViewRole(): boolean {
    const roleId = Number(sessionStorage.getItem('roleId'));
    return roleId == 4;
  }

  getRoleName(roleId: number) {
    return this.roleNames.find(r => r.roleId == roleId)?.name;
  }
}
