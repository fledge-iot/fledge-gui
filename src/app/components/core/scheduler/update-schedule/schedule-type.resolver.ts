import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SchedulesService } from '../../../../../app/services';

@Injectable({
    providedIn: 'root'
})
export class ScheduleTypeResolver  {
    constructor(private schedulesService: SchedulesService) { }
    resolve(route: ActivatedRouteSnapshot): Observable<any> {
        return this.schedulesService.getScheduleType().pipe(
            map(result =>
            (
                {
                    id: route.params['id'],
                    scheduleTypes: result['scheduleType']
                }
            )
            ),
            catchError(error => {
                console.error(error);
                // In case of error, return null
                return of(null);
            }
            ));
    }
}