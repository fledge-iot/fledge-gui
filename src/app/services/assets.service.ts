import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError, forkJoin, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class AssetsService {
  private GET_ASSET = environment.BASE_URL + 'asset';
  private TRACK_SERVICE_URL = environment.BASE_URL + 'track';
  constructor(private http: HttpClient) { }

  /**
  * GET  | fledge/asset
  * Return a summary count of all asset readings
  */
  public getAsset() {
    return this.http.get(this.GET_ASSET).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  /fledge/asset/{assetCode}
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

  public getMultipleAssetReadings(assetCode, limit: number = 0, offset: number = 0, time: number = 0, additionalAssets, previous: number = 0, mostrecent:boolean = false, previous_ts:string = '') {
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
    if (+additionalAssets.length !== 0) {
      params = params.set('additional', additionalAssets.toString());
    }
    if(mostrecent == true){
      params = params.append('mostrecent', mostrecent.toString());
    }
    if(previous != 0){
      params = params.append('previous', previous.toString());
    }
    if(previous_ts != ''){
      params = params.append('previous_ts', previous_ts);
    }

    return this.http.get(this.GET_ASSET + '/' + assetCode, { params: params }).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }


  public getLatestReadings(assetCode) {
    return this.http.get(`${this.GET_ASSET}/${encodeURIComponent(assetCode)}/latest`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  /**
  *  GET | /fledge/asset/{assetCode}
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
  *  fledge/{assetCode}/summary
  *  @param assetCode
  *  Return a set of readings summary for the given asset code
  */
  public getAllAssetSummary(assetCode: string, limit: Number = 0, time: Number = 0, previous: number = 0) {
    let params = new HttpParams();
    if (+time !== 0) {
      params = params.append('seconds', time.toString());
    }
    if (+limit !== 0) {
      params = params.set('limit', limit.toString());
    }
    if(+previous !== 0){
      params = params.append('previous', previous.toString());
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

  public purgeAssetData(assetCode) {
    return this.http.delete(`${this.GET_ASSET}/${encodeURIComponent(assetCode)}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public purgeAllAssetsData() {
    return this.http.delete(`${this.GET_ASSET}`).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }

  public deprecateAssetTrackEntry(serviceName: string, assetName: string, event: string) {
    return this.http.put(`${this.TRACK_SERVICE_URL}/service/${encodeURIComponent(serviceName)}/asset/${encodeURIComponent(assetName)}/event/${encodeURIComponent(event)}`, null).pipe(
      map(response => response),
      catchError(error => throwError(error)));
  }
}
