import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PingService } from './ping.service';

export const InterceptorSkipHeader = 'X-Skip-Interceptor';

@Injectable()
export class HttpsRequestInterceptor implements HttpInterceptor {

  constructor(private router: Router, private pingService: PingService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.headers.has(InterceptorSkipHeader)) {
      const headers = req.headers.delete(InterceptorSkipHeader);
      return next.handle(req.clone({ headers }));
    } else {
      if (sessionStorage.getItem('token') != null) {
        req = req.clone({
          setHeaders: {
            authorization: sessionStorage.getItem('token')
          }
        });
      }
      return next.handle(req).pipe(map((event: HttpEvent<any>) => {
        return event;
      }), catchError((err: any) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 401) {
            sessionStorage.clear();
          } else if (err.status === 403) {
            this.router.navigate(['/login']);
            this.pingService.pingIntervalChanged.next(0);
          }
          return observableThrowError(err);
        }
      }), );
    }
  }
}
