import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { AssetsService, GenerateCsvService, ProgressBarService, RolesService, ToastService } from '../../../../../services';
import { DeveloperFeaturesService } from '../../../../../services/developer-features.service';
import { MAX_INT_SIZE } from '../../../../../utils';
import { FlowEditorService } from '../../flow-editor.service';
import { Service } from '../../../../core/south/south-service';

@Component({
  selector: 'app-asset-tracker',
  templateUrl: './asset-tracker.component.html',
  styleUrls: ['./asset-tracker.component.css']
})
export class AssetTrackerComponent {

  destroy$: Subject<boolean> = new Subject<boolean>();
  public reenableButton = new EventEmitter<boolean>(false);
  @Input()service;
  @Output() selectedAsset = new EventEmitter<Object>();
  MAX_RANGE = MAX_INT_SIZE / 2;

  constructor(public developerFeaturesService: DeveloperFeaturesService,
    public flowEditorService: FlowEditorService,
    private toastService: ToastService,
    public rolesService: RolesService,
    public ngProgress: ProgressBarService,
    private assetService: AssetsService,
    public generateCsv: GenerateCsvService) {
  }

  selectAsset(assetName: string) {
    this.selectedAsset.emit({assetName: assetName});
  }

  getAssetReadings(service: Service) {
    const fileName = service.name + '-readings';
    const assets = service.assets;
    const assetRecord: any = [];
    if (assets.length === 0) {
      this.toastService.error('No readings to export.');
      return;
    }
    this.toastService.info('Exporting readings to ' + fileName);
    assets.forEach((ast: any) => {
      let limit = ast.count;
      let offset = 0;
      if (ast.count > this.MAX_RANGE) {
        limit = this.MAX_RANGE;
        const chunkCount = Math.ceil(ast.count / this.MAX_RANGE);
        let lastChunkLimit = (ast.count % this.MAX_RANGE);
        if (lastChunkLimit === 0) {
          lastChunkLimit = this.MAX_RANGE;
        }
        for (let j = 0; j < chunkCount; j++) {
          if (j !== 0) {
            offset = (this.MAX_RANGE * j);
          }
          if (j === (chunkCount - 1)) {
            limit = lastChunkLimit;
          }
          assetRecord.push({ asset: ast.asset, limit: limit, offset: offset });
        }
      } else {
        assetRecord.push({ asset: ast.asset, limit: limit, offset: offset });
      }
    });
    this.exportReadings(assetRecord, fileName);
  }

  exportReadings(assets: [], fileName: string) {
    let assetReadings = [];
    this.assetService.getMultiAssetsReadings(assets).
      subscribe(
        (result: any) => {
          this.reenableButton.emit(false);
          assetReadings = [].concat.apply([], result);
          this.generateCsv.download(assetReadings, fileName, 'service');
        },
        error => {
          this.reenableButton.emit(false);
          console.log('error in response', error);
        });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
