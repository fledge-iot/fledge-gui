import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export class SharedService {
    public isUserLoggedIn: Subject<any> = new Subject<any>();
    public isAdmin: Subject<boolean> = new Subject<boolean>();
}
