import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { AssetsService } from '../../services/index';

@Injectable()
export class AssetSummaryService {
    assetReadingSummary: Subject<Array<any>> = new Subject<Array<any>>();
    constructor(private assetService: AssetsService) { }

    public getReadingSummary(data: any) {
        const assetSummary = [];
        const keys = Object.keys(data.readings.reading);
        let count = 0;
        keys.forEach(key => {
            const assetObj: object = {
                asset_code: data.asset_code,
                reading: key,
                time: data.time
            };
            this.assetService.getAssetSummary(assetObj)
                .subscribe(
                summaryData => {
                    if (summaryData.error) {
                        console.log('error in response', summaryData.error);
                        return;
                    }
                    count++;
                    assetSummary.push({
                        asset_code: data.asset_code,
                        data: summaryData
                    });
                    if (count === keys.length) {
                        this.setAssetSummary(assetSummary);
                    }
                },
                error => {
                    console.log('error', error);
                });
        });
    }

    public setAssetSummary(assetSummary) {
        const assetReadingSummary = [];
        assetSummary.forEach(summary => {
            const keys = Object.keys(summary.data);
            keys.forEach(key => {
                assetReadingSummary.push({ key: key, summary: summary.data[key] });
            });
        });
        this.assetReadingSummary.next(assetReadingSummary);
    }
}
