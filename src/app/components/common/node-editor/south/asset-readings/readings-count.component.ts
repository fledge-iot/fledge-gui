import { Component, Input } from '@angular/core';
import { AssetControl, ReadingControl } from '../../controls/south-custom-control';

@Component({
  selector: 'readings-count',
  template: `<div class="reading-details">
                <small class="reading has-tooltip-top has-tooltip-arrow"
                  data-tooltip="Reading count">{{readingCount}}</small>
                <small class="asset has-tooltip-top has-tooltip-arrow"
                  data-tooltip="Asset count">{{assetCount}}</small>
        </div>`,
  styleUrls: ['./readings-count.component.css'],
})
export class ReadingsCountComponent {
  @Input() readingCount: ReadingControl;
  @Input() assetCount: AssetControl;
  constructor() { }
}



