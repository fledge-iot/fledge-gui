import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, forkJoin, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class AssetsService {
  private GET_ASSET = environment.BASE_URL + 'asset';
  constructor(private http: HttpClient) { }

  /**
  * GET  | foglamp/asset
  * Return a summary count of all asset readings
  */
  public getAsset() {
    return this.http.get(this.GET_ASSET).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  /foglamp/asset/{assetCode}
  * @param assetCode
  * @param limit
  *  Return a set of asset readings for the given asset code
  */
  public getAssetReadings(assetCode, limit: number = 0, offset: number = 0, time: number = 0) {
    let params = new HttpParams();
    if (+time !== 0) {
      params = params.append('seconds', time.toString());
    }
    if (+limit !== 0) {
      params = params.set('limit', limit.toString());
    }
    if (+offset !== 0) {
      params = params.set('offset', offset.toString());
    }
    return this.http.get(this.GET_ASSET + '/' + assetCode, { params: params }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  GET | /foglamp/asset/{assetCode}
  * @param assets Array of asset names with limits to pass
  *  Return a set of All asset readings for the given assets array
  */
  public getMultiAssetsReadings(assets: any): Observable<any[]> {
    const assetResponse = [];
    assets
      .map(assetCode => {
        let params = new HttpParams();
        if (assetCode.limit !== 0) {
          params = params.set('limit', assetCode.limit.toString());
        }
        if (assetCode.offset !== 0) {
          params = params.set('offset', assetCode.offset.toString());
        }
        let resp = this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetCode.asset), { params: params });
        resp = resp.pipe(map((response: any) => {
          const assetReadings = response.map(r => {
            r['assetName'] = assetCode['asset'];
            return r;
          });
          return assetReadings;
        })
        );
        return assetResponse.push(resp);
      });
    return forkJoin(assetResponse);
  }

  /**
  *  foglamp/{assetCode}/summary
  *  @param assetCode
  *  Return a set of readings summary for the given asset code
  */
  public getAllAssetSummary(assetCode: string, limit: Number = 0, time: Number = 0) {
    let params = new HttpParams();
    if (+time !== 0) {
      params = params.append('seconds', time.toString());
    }
    if (+limit !== 0) {
      params = params.set('limit', limit.toString());
    }
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetCode) + '/summary', { params: params }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }


  // TODO: Not in use yet
  public getAssetAverage(assetObject: any) {
    // TODO: time based readings average;
    return this.http.get(this.GET_ASSET + '/' + encodeURIComponent(assetObject.assetCode) + '/' + assetObject.reading + '/series').pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
