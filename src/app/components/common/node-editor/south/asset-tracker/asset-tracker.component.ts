import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RolesService } from '../../../../../services';
import { DeveloperFeaturesService } from '../../../../../services/developer-features.service';
import { Service } from '../../../../core/south/south-service';

@Component({
  selector: 'app-asset-tracker',
  templateUrl: './asset-tracker.component.html',
  styleUrls: ['./asset-tracker.component.css']
})
export class AssetTrackerComponent {

  @Input() reenableButton = new EventEmitter<boolean>(false);
  @Input() service: Service;
  @Input() isAlive: boolean;
  @Output() selectedAsset = new EventEmitter<Object>();
  @Output() reloadReadings = new EventEmitter<Object>();
  @Output() exportReading = new EventEmitter<Object>();

  constructor(public developerFeaturesService: DeveloperFeaturesService,
    public rolesService: RolesService) {
  }

  selectAsset(assetName: string) {
    this.selectedAsset.emit({assetName: assetName});
  }

  exportReadings() {
    this.exportReading.emit(true);
  }

  reload() {
    this.reloadReadings.emit(true);
  }
}
