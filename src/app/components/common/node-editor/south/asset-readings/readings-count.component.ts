import { Component, Input } from '@angular/core';
import { AssetControl, ReadingControl } from '../../controls/south-custom-control';
import { FlowEditorService } from '../../flow-editor.service';

@Component({
  selector: 'readings-count',
  templateUrl: './readings-count.component.html',
  styleUrls: ['./readings-count.component.css'],
})
export class ReadingsCountComponent {
  @Input() readingCount: ReadingControl;
  @Input() assetCount: AssetControl;
  @Input() serviceName;
  readingsCount;
  constructor(public flowEditorService: FlowEditorService) { }
  
  ngOnInit(){
    this.readingsCount = this.readingCount;
  }
  
  showReadingsPerAsset() {
    this.flowEditorService.showItemsInQuickview.next({ showReadings: true, serviceName: this.serviceName });
  }
}
