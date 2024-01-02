import { Injectable } from '@angular/core';

import { RolesService } from '../services';

@Injectable()
export class DataViewRoleGuard  {
    constructor(public rolesService: RolesService) { }
    canActivate() {
        const isDataViewRole = this.rolesService.hasDataViewRole();
        if (isDataViewRole) {
            return false;
        }
        return true;
    }
}
