import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { RolesService } from '../../../../../services';
import { DeveloperFeaturesService } from '../../../../../services/developer-features.service';

@Component({
  selector: 'app-asset-tracker',
  templateUrl: './asset-tracker.component.html',
  styleUrls: ['./asset-tracker.component.css']
})
export class AssetTrackerComponent {

  destroy$: Subject<boolean> = new Subject<boolean>();
  @Input() reenableButton = new EventEmitter<boolean>(false);
  @Input()service;
  @Input()isAlive;
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

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
